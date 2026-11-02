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
use App\Mcp\Tools\ShowAwardTool;
use App\Mcp\Tools\ShowArticleTool;
use App\Mcp\Tools\ShowPostTool;
use App\Mcp\Tools\UpdateArticleTool;
use App\Models\Article;
use App\Models\Award;
use App\Models\Post;
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

    public function test_list_articles_returns_only_compact_article_fields(): void
    {
        Article::factory()->create([
            'title' => 'Compact article',
            'slug' => 'compact-article',
            'body' => '<p>Full article body</p>',
        ]);

        $this->callCatalog($this->admin, ListArticlesTool::class)
            ->assertOk()
            ->assertSee('"title":"Compact article"')
            ->assertSee('"slug":"compact-article"')
            ->assertDontSee('Full article body')
            ->assertDontSee('"body"');
    }

    public function test_list_posts_returns_only_compact_post_fields_and_show_returns_details(): void
    {
        $post = Post::query()->create([
            'user_id' => $this->admin->id,
            'type' => 'news',
            'visibility' => 'public',
            'images' => ['https://example.test/post-image.jpg'],
            'featured' => true,
        ]);

        $this->callCatalog($this->admin, ListPostsTool::class)
            ->assertOk()
            ->assertSee('"id":'.$post->id)
            ->assertSee('"type":"news"')
            ->assertSee('"visibility":"public"')
            ->assertDontSee('post-image.jpg')
            ->assertDontSee('"featured"');

        $this->callCatalog($this->admin, ShowPostTool::class, ['post' => $post->id])
            ->assertOk()
            ->assertSee('post-image.jpg');
    }

    public function test_list_awards_returns_only_compact_award_fields_and_show_returns_details(): void
    {
        $award = Award::query()->create([
            'person_id' => 'STU-2026-001',
            'award_id' => 'DIP-2026-001',
            'full_name' => 'Award Holder',
            'father_name' => 'Parent Name',
            'awarded_at' => '2026-06-15',
        ]);

        $this->callCatalog($this->admin, ListAwardsTool::class)
            ->assertOk()
            ->assertSee('"id":'.$award->id)
            ->assertSee('"person_id":"STU-2026-001"')
            ->assertSee('"award_id":"DIP-2026-001"')
            ->assertDontSee('Award Holder')
            ->assertDontSee('Parent Name')
            ->assertDontSee('awarded_at');

        $this->callCatalog($this->admin, ShowAwardTool::class, ['award' => $award->id])
            ->assertOk()
            ->assertSee('Award Holder')
            ->assertSee('Parent Name');
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
