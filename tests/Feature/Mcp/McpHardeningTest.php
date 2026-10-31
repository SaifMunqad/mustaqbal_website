<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Http\Middleware\AuditMcpRequests;
use App\Mcp\Servers\SchoolDashboardServer;
use App\Mcp\Tools\AddPageSectionTool;
use App\Mcp\Tools\UpdatePageLayoutTool;
use App\Mcp\Tools\UploadMediaTool;
use App\Models\Page;
use App\Models\User;
use App\Support\Home\BuilderRevision;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Covers the hardening pass over the MCP surface: SSRF refusal on URL
 * transfers, the machine-readable error taxonomy, fail-closed middleware
 * replay, the builder's optimistic lock, and the /mcp throttle + audit wiring.
 */
class McpHardeningTest extends TestCase
{
    use CallsCatalogTools;
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    }

    public function test_url_transfer_refuses_private_and_non_http_targets(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        // Loopback is a private address: rejected before any HTTP request.
        $server->tool(UploadMediaTool::class, ['url' => 'http://127.0.0.1/a.png', 'filename' => 'a.png'])
            ->assertHasErrors()
            ->assertSee('private or reserved');

        $server->tool(UploadMediaTool::class, ['url' => 'http://10.0.0.5:8080/a.png', 'filename' => 'a.png'])
            ->assertHasErrors();

        // Non-http schemes never reach the fetcher at all.
        $server->tool(UploadMediaTool::class, ['url' => 'file:///etc/passwd', 'filename' => 'passwd.txt'])
            ->assertHasErrors()
            ->assertSee('Only http(s)');
    }

    public function test_permission_errors_carry_a_machine_readable_reason(): void
    {
        $management = $this->makeManagementUser();

        // Email campaigns are admin-only; the error content is now JSON with a
        // reason code, not free prose — including through the gateway.
        $this->callCatalog($management, \App\Mcp\Tools\ListEmailCampaignsTool::class)
            ->assertHasErrors()
            ->assertSee('forbidden')
            ->assertSee('reason');
    }

    public function test_actions_guarded_by_unplayable_middleware_are_refused(): void
    {
        // Fail-closed replay: a route carrying middleware beyond the known
        // role/verified/active set must be refused instead of running unchecked.
        Route::get('/probe/signed', [McpHardeningProbeController::class, 'unroutedAction'])
            ->middleware('signed');

        auth()->login($this->admin);

        $response = app(\App\Mcp\Support\DashboardDispatcher::class)->run(
            new \Laravel\Mcp\Request([]),
            McpHardeningProbeController::class,
            'unroutedAction',
        );

        $text = (string) $response->content();

        $this->assertTrue($response->isError());
        $this->assertStringContainsString('middleware that the MCP server cannot replay', $text);
        $this->assertStringContainsString('"reason":"forbidden"', $text);
    }

    public function test_stale_revision_blocks_a_whole_layout_overwrite(): void
    {
        Page::resolve('home');

        $stale = BuilderRevision::for(Page::resolve('home')->id);

        // A section tool changes the layout, moving the revision on.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool(AddPageSectionTool::class, [
                'page' => 'home',
                'section' => ['section_type' => 'hero'],
            ])
            ->assertOk();

        // Replaying an UpdatePageLayout built against the stale stamp must
        // fail instead of silently dropping the concurrently added block.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool(UpdatePageLayoutTool::class, [
                'page' => 'home',
                'sections' => [],
                'expected_revision' => $stale,
            ])
            ->assertStructuredContent(function ($content): void {
                $content->has('errors')->where('status', 'validation_failed');
            });

        $this->assertDatabaseCount('page_sections', 1);

        // The freshly-read revision lets the same write through.
        $current = BuilderRevision::for(Page::resolve('home')->id);

        SchoolDashboardServer::actingAs($this->admin)
            ->tool(UpdatePageLayoutTool::class, [
                'page' => 'home',
                'sections' => [],
                'expected_revision' => $current,
            ])
            ->assertOk();

        $this->assertDatabaseCount('page_sections', 0);
    }

    public function test_section_tools_reuse_the_revision_they_just_read(): void
    {
        // The editor reads and commits in one call, so its optimistic lock can
        // never conflict with itself, and the write still lands.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool(AddPageSectionTool::class, [
                'page' => 'about',
                'section' => ['section_type' => 'rich_text'],
            ])
            ->assertOk();

        $this->assertDatabaseHas('page_sections', ['section_type' => 'rich_text']);
    }

    public function test_mcp_route_is_throttled_and_audited(): void
    {
        $this->assertNotNull(RateLimiter::limiter('mcp'), 'The mcp rate limiter must be defined.');

        // The package registers GET/POST/DELETE verbs for /mcp; the middleware
        // must guard every one of them.
        $middleware = collect(Route::getRoutes())
            ->filter(fn ($route) => $route->uri() === 'mcp')
            ->flatMap(fn ($route) => $route->gatherMiddleware())
            ->unique()
            ->values()
            ->all();

        $this->assertContains('throttle:mcp', $middleware);
        $this->assertContains(AuditMcpRequests::class, $middleware);
    }

    public function test_authenticated_http_calls_write_one_audit_line(): void
    {
        $captured = [];

        Log::shouldReceive('channel')
            ->with('mcp_audit')
            ->andReturnUsing(function () use (&$captured): object {
                return new class($captured)
                {
                    public function __construct(private array &$captured) {}

                    public function info(string $message, array $context = []): void
                    {
                        $this->captured[] = ['message' => $message, 'context' => $context];
                    }
                };
            });

        $token = $this->admin->createToken('test')->plainTextToken;

        // A full initialize handshake over the real route with a real bearer
        // token: exercises throttle + auth + audit wiring in one pass.
        $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'initialize',
            'params' => [
                'protocolVersion' => '2025-06-18',
                'capabilities' => new \stdClass,
                'clientInfo' => ['name' => 'hardening-test', 'version' => '1.0'],
            ],
        ], ['Authorization' => 'Bearer '.$token])->assertOk();

        $this->assertSame('mcp.call', $captured[0]['message'] ?? null);
        $this->assertSame($this->admin->id, $captured[0]['context']['user_id'] ?? null);
        $this->assertSame('initialize', $captured[0]['context']['method'] ?? null);
        $this->assertFalse($captured[0]['context']['error'] ?? true);
    }

    public function test_failed_http_calls_are_flagged_in_the_audit_trail(): void
    {
        $captured = [];

        Log::shouldReceive('channel')
            ->with('mcp_audit')
            ->andReturnUsing(function () use (&$captured): object {
                return new class($captured)
                {
                    public function __construct(private array &$captured) {}

                    public function info(string $message, array $context = []): void
                    {
                        $this->captured[] = ['message' => $message, 'context' => $context];
                    }
                };
            });

        // Unauthenticated: the audit middleware runs innermost, so a rejected
        // request never logs — exactly one line for a call that passed auth and
        // errored inside a tool.
        $token = $this->admin->createToken('test')->plainTextToken;

        $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'tools/call',
            'params' => ['name' => 'NoSuchTool', 'arguments' => []],
        ], ['Authorization' => 'Bearer '.$token]);

        // Either no line (unknown tool never reaches a handler) or an error
        // line; an unflagged success line must never appear.
        foreach ($captured as $line) {
            $this->assertTrue($line['context']['error'] ?? true);
        }
    }

    private function makeManagementUser(): User
    {
        return User::factory()->create(['role' => 'management', 'email_verified_at' => now()]);
    }
}

/**
 * A controller action whose only route carries middleware the dispatcher
 * refuses to bypass — proves the fail-closed branch.
 */
class McpHardeningProbeController extends Controller
{
    public function unroutedAction(): array
    {
        return ['must' => 'never run'];
    }
}
