<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Mcp\Tools\CreateArticleTool;
use App\Mcp\Tools\DashboardStatsTool;
use App\Mcp\Tools\GetHomePageLayoutTool;
use App\Mcp\Tools\ListArticlesTool;
use App\Mcp\Tools\ListEmailCampaignsTool;
use App\Mcp\Tools\UpdateHomePageLayoutTool;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardMcpTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

        return $admin;
    }

    public function test_stats_tool_returns_dashboard_counters(): void
    {
        SchoolDashboardServer::actingAs($this->admin())
            ->tool(DashboardStatsTool::class, [])
            ->assertOk()
            ->assertStructuredContent(function ($content): void {
                $content->has('stats');
            });
    }

    public function test_list_articles_tool_is_authorized_for_admin(): void
    {
        SchoolDashboardServer::actingAs($this->admin())
            ->tool(ListArticlesTool::class, [])
            ->assertOk();
    }

    public function test_home_page_layout_can_be_read_and_saved_through_mcp(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin());

        $server->tool(GetHomePageLayoutTool::class, [])
            ->assertOk()
            ->assertStructuredContent(function ($content): void {
                $content->has('page')
                    ->has('sections')
                    ->has('palette')
                    ->has('categories')
                    ->has('availableItems')
                    ->has('defaultLanguage');
            });

        $server->tool(UpdateHomePageLayoutTool::class, ['sections' => []])
            ->assertOk()
            ->assertStructuredContent(function ($content): void {
                $content->has('redirect')->has('messages')->where('status', 'success');
            });
    }

    public function test_home_page_layout_write_rejects_invalid_section_types(): void
    {
        SchoolDashboardServer::actingAs($this->admin())
            ->tool(UpdateHomePageLayoutTool::class, [
                'sections' => [['section_type' => 'not-a-section', 'is_active' => true]],
            ])
            ->assertStructuredContent(function ($content): void {
                $content->has('errors')->where('status', 'validation_failed');
            });
    }

    public function test_create_article_reports_validation_errors_to_the_caller(): void
    {
        // Sending an empty payload must surface the dashboard form's validation
        // errors rather than performing a partial write.
        SchoolDashboardServer::actingAs($this->admin())
            ->tool(CreateArticleTool::class, [])
            ->assertStructuredContent(function ($content): void {
                $content->has('errors')->where('status', 'validation_failed');
            });
    }

    public function test_create_article_persists_through_the_existing_controller(): void
    {
        SchoolDashboardServer::actingAs($this->admin())
            ->tool(CreateArticleTool::class, [
                'title' => 'Science Fair 2026',
                'body' => '<p>The annual science fair returns this spring.</p>',
                'is_published' => true,
            ])
            ->assertOk()
            ->assertStructuredContent(function ($content): void {
                $content->has('redirect')->has('messages')->where('status', 'success');
            });

        $this->assertDatabaseHas('articles', ['title' => 'Science Fair 2026']);
    }

    public function test_route_role_middleware_is_replayed_for_mcp_callers(): void
    {
        // Email campaigns are admin-only in routes/web.php. A management account
        // must be blocked here exactly as it is in the browser, even though the
        // dispatcher calls the controller directly.
        $management = User::factory()->create(['role' => 'management', 'email_verified_at' => now()]);

        SchoolDashboardServer::actingAs($management)
            ->tool(ListEmailCampaignsTool::class, [])
            ->assertHasErrors();
    }

    public function test_unauthenticated_callers_are_rejected(): void
    {
        $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => 'tools/call',
            'params' => ['name' => 'DashboardStats', 'arguments' => []],
        ])->assertUnauthorized();
    }
}
