<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
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

    public function test_tools_list_uses_cursor_pagination_to_expose_all_tools(): void
    {
        auth()->setUser($this->admin);
        $server = app()->make(SchoolDashboardServer::class, ['transport' => new FakeTransporter]);
        $server->start();
        $context = $server->createContext();

        // 1. First page without cursor: returns the default page size (15) and a nextCursor.
        $request1 = new JsonRpcRequest(id: 'page-1', method: 'tools/list', params: []);
        /** @var JsonRpcResponse $response1 */
        $response1 = (fn () => $this->runMethodHandle($request1, $context))->call($server);
        $result1 = $response1->toArray()['result'];

        $this->assertCount(15, $result1['tools']);
        $this->assertArrayHasKey('nextCursor', $result1);
        $this->assertNotEmpty($result1['nextCursor']);

        // 2. Fetch all pages by following nextCursor until exhaustion.
        $allCollected = [...$result1['tools']];
        $cursor = $result1['nextCursor'];

        while ($cursor !== null) {
            $req = new JsonRpcRequest(id: uniqid('page-'), method: 'tools/list', params: ['cursor' => $cursor]);
            /** @var JsonRpcResponse $res */
            $res = (fn () => $this->runMethodHandle($req, $context))->call($server);
            $pageResult = $res->toArray()['result'];

            $allCollected = [...$allCollected, ...$pageResult['tools']];
            $cursor = $pageResult['nextCursor'] ?? null;
        }

        $names = array_column($allCollected, 'name');

        // All tools across every module are discoverable via pagination.
        $this->assertGreaterThanOrEqual(90, count($names));
        $this->assertContains('DashboardStats', $names);
        $this->assertContains('GetPageLayout', $names);
        $this->assertContains('AddPageSection', $names);
        $this->assertContains('UploadMedia', $names);
        $this->assertContains('ListBooks', $names);
        $this->assertContains('CreateEvent', $names);
        $this->assertContains('ListLanguages', $names);
        $this->assertContains('RetryEmailCampaign', $names);
    }

    public function test_tools_list_pagination_works_in_production_environment(): void
    {
        app()['env'] = 'production';
        config(['app.debug' => false]);

        $items = (new ReflectionClass(\Laravel\Mcp\Server\Testing\TestListResponse::class))
            ->getProperty('items')
            ->getValue(SchoolDashboardServer::actingAs($this->admin)->tools());

        $names = array_column($items, 'name');

        // In production, the entire tools list is available through cursor pagination
        // rather than being hidden behind search_tools/execute_tools.
        $this->assertGreaterThanOrEqual(90, count($names));
        $this->assertContains('ListBooks', $names);
        $this->assertContains('CreateEvent', $names);
        $this->assertContains('RetryEmailCampaign', $names);
        $this->assertContains('ListLanguages', $names);
        $this->assertContains('DashboardStats', $names);
    }

    public function test_tools_list_respects_custom_per_page(): void
    {
        auth()->setUser($this->admin);
        $server = app()->make(SchoolDashboardServer::class, ['transport' => new FakeTransporter]);
        $server->start();
        $context = $server->createContext();

        $request = new JsonRpcRequest(id: 'page-custom', method: 'tools/list', params: ['per_page' => 25]);
        /** @var JsonRpcResponse $response */
        $response = (fn () => $this->runMethodHandle($request, $context))->call($server);
        $result = $response->toArray()['result'];

        $this->assertCount(25, $result['tools']);
        $this->assertArrayHasKey('nextCursor', $result);
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
