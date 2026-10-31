<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Tools\ExecuteTools;
use Laravel\Mcp\Server\Tools\SearchTools;
use Laravel\Mcp\Server\Tools\ToolSearch;
use ReflectionClass;
use Tests\TestCase;

/**
 * Covers the dynamic tool-loading surface: the catalogued module tools are
 * reached through the search_tools + execute_tools pair instead of being
 * listed (and paid for in client context) individually, while the core
 * builder/stats tools stay eagerly registered.
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
        $this->assertLessThanOrEqual(15, count($names));
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
