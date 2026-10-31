<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Tools\GetSiteSettingsTool;
use App\Mcp\Tools\GetWhatsAppSettingsTool;
use App\Mcp\Tools\ListArticlesTool;
use App\Mcp\Tools\ListAwardsTool;
use App\Mcp\Tools\ListBookCategoriesTool;
use App\Mcp\Tools\ListBooksTool;
use App\Mcp\Tools\ListContactsTool;
use App\Mcp\Tools\ListEmailCampaignsTool;
use App\Mcp\Tools\ListEnrollmentsTool;
use App\Mcp\Tools\ListEventsTool;
use App\Mcp\Tools\ListJobApplicationsTool;
use App\Mcp\Tools\ListJobsTool;
use App\Mcp\Tools\ListLanguagesTool;
use App\Mcp\Tools\ListMailsTool;
use App\Mcp\Tools\ListMessagesTool;
use App\Mcp\Tools\ListPostsTool;
use App\Mcp\Tools\ListProgramsTool;
use App\Mcp\Tools\ListUsersTool;
use App\Mcp\Tools\ListWhatsAppCampaignsTool;
use App\Mcp\Tools\ShowArticleTool;
use App\Mcp\Tools\UpdateArticleTool;
use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Exercises a wide slice of the dashboard surface through MCP to prove the
 * shared dispatcher wires up reads, model-bound reads/writes, service injection
 * and nullable bindings against the real controllers.
 */
class DashboardMcpCoverageTest extends TestCase
{
    use CallsCatalogTools;
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    }

    public static function readTools(): array
    {
        return [
            'articles' => ['tool' => ListArticlesTool::class, 'args' => []],
            'posts' => ['tool' => ListPostsTool::class, 'args' => []],
            'events' => ['tool' => ListEventsTool::class, 'args' => []],
            'enrollments' => ['tool' => ListEnrollmentsTool::class, 'args' => []],
            'users' => ['tool' => ListUsersTool::class, 'args' => []],
            'programs' => ['tool' => ListProgramsTool::class, 'args' => []],
            'jobs' => ['tool' => ListJobsTool::class, 'args' => []],
            'job_applications' => ['tool' => ListJobApplicationsTool::class, 'args' => []],
            'books' => ['tool' => ListBooksTool::class, 'args' => []],
            'book_categories' => ['tool' => ListBookCategoriesTool::class, 'args' => []],
            'contacts' => ['tool' => ListContactsTool::class, 'args' => []],
            'messages' => ['tool' => ListMessagesTool::class, 'args' => []],
            'awards' => ['tool' => ListAwardsTool::class, 'args' => []],
            'languages' => ['tool' => ListLanguagesTool::class, 'args' => []],
            'email_campaigns' => ['tool' => ListEmailCampaignsTool::class, 'args' => []],
            'whatsapp_campaigns' => ['tool' => ListWhatsAppCampaignsTool::class, 'args' => []],
            'whatsapp_settings' => ['tool' => GetWhatsAppSettingsTool::class, 'args' => []],
            'site_settings' => ['tool' => GetSiteSettingsTool::class, 'args' => []],
            'mails' => ['tool' => ListMailsTool::class, 'args' => []],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('readTools')]
    public function test_read_tool_delegates_to_controller(string $tool, array $args): void
    {
        // Reads run through the execute_tools gateway, the production path for
        // catalogued tools (and a harmless wrapper around eager ones).
        $this->callCatalog($this->admin, $tool, $args)
            ->assertOk();
    }

    public function test_model_bound_read_returns_the_record(): void
    {
        $article = Article::factory()->create();

        $this->callCatalog($this->admin, ShowArticleTool::class, ['article' => $article->id])
            ->assertOk()
            ->assertSee('"article"');
    }

    public function test_model_bound_write_updates_the_record(): void
    {
        $article = Article::factory()->create(['title' => 'Before', 'user_id' => $this->admin->id]);

        $this->callCatalog($this->admin, UpdateArticleTool::class, [
            'article' => $article->id,
            'title' => 'After MCP',
            'body' => '<p>updated</p>',
        ])
            ->assertOk();

        $this->assertDatabaseHas('articles', ['id' => $article->id, 'title' => 'After MCP']);
    }
}
