<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Models\Event;
use App\Models\Language;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Transport\FakeTransporter;
use Laravel\Mcp\Transport\JsonRpcRequest;
use Laravel\Mcp\Transport\JsonRpcResponse;
use ReflectionClass;
use Tests\TestCase;

/**
 * Covers the MCP tools pagination system: the complete dashboard tools list
 * is exposed across modules and paginated via standard cursor pagination,
 * allowing AI clients (like Gemini) to discover and call all tools directly.
 */
class ToolSearchMcpTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    }

    public function test_tools_list_returns_full_catalogue_by_default_for_ai_knowledge(): void
    {
        auth()->setUser($this->admin);
        $server = app()->make(SchoolDashboardServer::class, ['transport' => new FakeTransporter]);
        $server->start();
        $context = $server->createContext();

        // Default call without per_page returns all tools in one shot so clients
        // like Gemini that do not iterate pagination receive the full catalogue.
        $request = new JsonRpcRequest(id: 'all-tools', method: 'tools/list', params: []);
        /** @var JsonRpcResponse $response */
        $response = (fn () => $this->runMethodHandle($request, $context))->call($server);
        $result = $response->toArray()['result'];

        $this->assertGreaterThanOrEqual(90, count($result['tools']));

        $names = array_column($result['tools'], 'name');
        $this->assertContains('DashboardStats', $names);
        $this->assertContains('CreateEvent', $names);
        $this->assertContains('UpdateEvent', $names);
        $this->assertContains('ListBooks', $names);
        $this->assertContains('ListLanguages', $names);
    }

    public function test_tools_list_supports_cursor_pagination_when_requested(): void
    {
        auth()->setUser($this->admin);
        $server = app()->make(SchoolDashboardServer::class, ['transport' => new FakeTransporter]);
        $server->start();
        $context = $server->createContext();

        // 1. First page with per_page: 25 returns 25 tools and a nextCursor.
        $request1 = new JsonRpcRequest(id: 'page-1', method: 'tools/list', params: ['per_page' => 25]);
        /** @var JsonRpcResponse $response1 */
        $response1 = (fn () => $this->runMethodHandle($request1, $context))->call($server);
        $result1 = $response1->toArray()['result'];

        $this->assertCount(25, $result1['tools']);
        $this->assertArrayHasKey('nextCursor', $result1);
        $this->assertNotEmpty($result1['nextCursor']);

        // 2. Fetch all remaining pages by following nextCursor until exhaustion.
        $allCollected = [...$result1['tools']];
        $cursor = $result1['nextCursor'];

        while ($cursor !== null) {
            $req = new JsonRpcRequest(id: uniqid('page-'), method: 'tools/list', params: ['cursor' => $cursor, 'per_page' => 25]);
            /** @var JsonRpcResponse $res */
            $res = (fn () => $this->runMethodHandle($req, $context))->call($server);
            $pageResult = $res->toArray()['result'];

            $allCollected = [...$allCollected, ...$pageResult['tools']];
            $cursor = $pageResult['nextCursor'] ?? null;
        }

        $names = array_column($allCollected, 'name');

        // All tools across every module are discoverable via cursor pagination.
        $this->assertGreaterThanOrEqual(90, count($names));
        $this->assertContains('DashboardStats', $names);
        $this->assertContains('GetPageLayout', $names);
        $this->assertContains('CreateEvent', $names);
        $this->assertContains('ListBooks', $names);
        $this->assertContains('ListLanguages', $names);
    }

    public function test_tools_list_pagination_works_in_production_environment(): void
    {
        app()['env'] = 'production';
        config(['app.debug' => false]);

        $items = (new ReflectionClass(\Laravel\Mcp\Server\Testing\TestListResponse::class))
            ->getProperty('items')
            ->getValue(SchoolDashboardServer::actingAs($this->admin)->tools());

        $names = array_column($items, 'name');

        // In production, the entire tools list is available
        $this->assertGreaterThanOrEqual(90, count($names));
        $this->assertContains('ListBooks', $names);
        $this->assertContains('CreateEvent', $names);
        $this->assertContains('RetryEmailCampaign', $names);
        $this->assertContains('ListLanguages', $names);
        $this->assertContains('DashboardStats', $names);
    }

    public function test_ai_can_create_new_event_with_top_level_fields(): void
    {
        // An AI typically passes title, description, location, and start_at directly
        $response = SchoolDashboardServer::actingAs($this->admin)
            ->tool(\App\Mcp\Tools\CreateEventTool::class, [
                'title' => 'Annual Science Fair 2026',
                'description' => 'A showcase of science experiments and models.',
                'location' => 'Main Auditorium',
                'start_at' => '2026-11-25 10:00:00',
                'end_at' => '2026-11-25 16:00:00',
                'audience' => 'public',
            ]);

        $response->assertOk();
        $response->assertSee('flash.eventCreated');

        $this->assertDatabaseHas('events', [
            'audience' => 'public',
            'is_published' => true,
        ]);

        $event = Event::query()->latest('id')->first();
        $this->assertNotNull($event);
        $this->assertSame('Annual Science Fair 2026', $event->translated('title', Language::defaultCode()));
        $this->assertDatabaseHas('event_translations', [
            'event_id' => $event->id,
            'title' => 'Annual Science Fair 2026',
            'location' => 'Main Auditorium',
        ]);
    }

    public function test_tools_can_be_called_directly_by_name(): void
    {
        SchoolDashboardServer::actingAs($this->admin)
            ->tool(\App\Mcp\Tools\ListLanguagesTool::class, [])
            ->assertOk()
            ->assertSee('languages');

        SchoolDashboardServer::actingAs($this->admin)
            ->tool(\App\Mcp\Tools\ListBooksTool::class, [])
            ->assertOk()
            ->assertSee('books');
    }

    public function test_direct_tool_calls_enforce_role_guards(): void
    {
        $management = User::factory()->create(['role' => 'management', 'email_verified_at' => now()]);

        // Email campaigns are admin-only; direct call by a management user must
        // fail closed with forbidden reason.
        SchoolDashboardServer::actingAs($management)
            ->tool(\App\Mcp\Tools\ListEmailCampaignsTool::class, [])
            ->assertHasErrors()
            ->assertSee('forbidden');
    }
}
