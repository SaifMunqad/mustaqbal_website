<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Tools\ExecuteTools;
use Laravel\Mcp\Server\Tools\SearchTools;
use Laravel\Mcp\Server\Tools\ToolSearch;
use Laravel\Mcp\Server\Transport\FakeTransporter;
use ReflectionClass;
use Tests\TestCase;

/**
 * Covers environment-dependent catalog loading: local debug exposes module
 * tools in the paginated list, while other environments use the search
 * gateway and keep the core builder/stats tools eagerly registered.
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

    /**
     * @return array<int, class-string>
     */
    private static function catalog(): array
    {
        $entries = (new ReflectionClass(SchoolDashboardServer::class))->getDefaultProperties()['tools'];

        return $entries[ToolSearch::class];
    }

    private function searchTools(): SearchTools
    {
        return new SearchTools(new ToolSearch(self::catalog()));
    }

    private function executeTools(): ExecuteTools
    {
        return new ExecuteTools(new ToolSearch(self::catalog()), (int) config('mcp.tool_search.max_tool_calls', 10));
    }

    public function test_list_exposes_meta_tools_and_core_but_not_catalogued_modules(): void
    {
        app()['env'] = 'production';
        config(['app.debug' => false]);

        $items = (new ReflectionClass(\Laravel\Mcp\Server\Testing\TestListResponse::class))
            ->getProperty('items')
            ->getValue(SchoolDashboardServer::actingAs($this->admin)->tools());

        $names = array_column($items, 'name');

        // The two gateway tools plus the always-listed core surface.
        $this->assertContains('search_tools', $names);
        $this->assertContains('execute_tools', $names);
        $this->assertContains('DashboardStats', $names);
        $this->assertContains('GetPageLayout', $names);
        $this->assertContains('AddPageSection', $names);
        $this->assertContains('UploadMedia', $names);

        // Catalogued module tools are discovered, not listed.
        $this->assertNotContains('ListBooks', $names);
        $this->assertNotContains('CreateEvent', $names);
        $this->assertNotContains('RetryEmailCampaign', $names);

        // Eager + two gateways is what the client sees, not all 89.
        $this->assertLessThanOrEqual(16, count($names));
    }

    public function test_local_debug_lists_catalogued_tools_for_cursor_pagination(): void
    {
        app()['env'] = 'local';
        config(['app.debug' => true]);

        auth()->setUser($this->admin);
        $server = app()->make(SchoolDashboardServer::class, ['transport' => new FakeTransporter]);
        $contextTools = $server->createContext()->tools();
        $names = $contextTools->map(fn ($tool): string => $tool->name())->all();

        $this->assertContains('ListBooks', $names);
        $this->assertContains('CreateEvent', $names);
        $this->assertNotContains('search_tools', $names);
        $this->assertNotContains('execute_tools', $names);
    }

    public function test_search_tools_discovers_catalogued_tools_with_schemas(): void
    {
        SchoolDashboardServer::actingAs($this->admin)
            ->tool($this->searchTools(), ['query' => 'whatsapp campaign'])
            ->assertOk()
            ->assertSee('CreateWhatsAppCampaign')
            ->assertSee('RetryWhatsAppCampaign');

        // Keyword browsing finds the bookstore cluster by name and description.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool($this->searchTools(), ['query' => 'book'])
            ->assertOk()
            ->assertSee('ListBooks')
            ->assertSee('UpdateBookCategory');

        // Content tools are intentionally discoverable through the catalog,
        // rather than appearing in the paginated tools/list response.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool($this->searchTools(), ['query' => 'article'])
            ->assertOk()
            ->assertSee('ListArticles')
            ->assertSee('ShowArticle')
            ->assertSee('CreateArticle')
            ->assertSee('UpdateArticle');

        // Returned matches carry their input schema for direct use.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool($this->searchTools(), ['query' => 'GetHomePageLayout'])
            ->assertOk()
            ->assertSee('inputSchema');
    }

    public function test_execute_tools_runs_catalogued_tools_in_order(): void
    {
        SchoolDashboardServer::actingAs($this->admin)
            ->tool($this->executeTools(), [
                'calls' => [
                    ['name' => 'ListLanguages', 'arguments' => []],
                    ['name' => 'ListPosts', 'arguments' => []],
                ],
            ])
            ->assertOk()
            ->assertSee('ListLanguages')
            ->assertSee('ListPosts');
    }

    public function test_execute_tools_enforces_the_same_role_guards(): void
    {
        $management = User::factory()->create(['role' => 'management', 'email_verified_at' => now()]);

        // Email campaigns are admin-only; the wrapped call must fail closed
        // with the same reason-coded error a direct call produces (the inner
        // JSON arrives escaped inside the batch result).
        SchoolDashboardServer::actingAs($management)
            ->tool($this->executeTools(), [
                'calls' => [['name' => 'ListEmailCampaigns', 'arguments' => []]],
            ])
            ->assertSee('forbidden');
    }

    public function test_execute_tools_refuses_unknown_and_uncatalogued_names(): void
    {
        // Not in the catalog at all.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool($this->executeTools(), [
                'calls' => [['name' => 'TotallyMadeUpTool', 'arguments' => []]],
            ])
            ->assertSee('not found in the catalog');

        // Eager tools are called directly, not through the gateway.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool($this->executeTools(), [
                'calls' => [['name' => 'DashboardStats', 'arguments' => []]],
            ])
            ->assertSee('not found in the catalog');
    }

    public function test_execute_tools_respects_the_batch_cap(): void
    {
        $max = (int) config('mcp.tool_search.max_tool_calls', 10);
        $calls = array_fill(0, $max + 1, ['name' => 'ListLanguages', 'arguments' => []]);

        SchoolDashboardServer::actingAs($this->admin)
            ->tool($this->executeTools(), ['calls' => $calls])
            ->assertHasErrors();
    }
}
