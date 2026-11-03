<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Mcp\Tools\CreateArticleTool;
use App\Mcp\Tools\CreatePostTool;
use App\Mcp\Tools\DashboardStatsTool;
use App\Mcp\Tools\GetHomePageLayoutTool;
use App\Mcp\Tools\ListArticlesTool;
use App\Mcp\Tools\ListEmailCampaignsTool;
use App\Mcp\Tools\UpdateArticleTool;
use App\Mcp\Tools\UpdateHomePageLayoutTool;
use App\Mcp\Tools\UpdatePostTool;
use App\Models\Article;
use App\Models\Language;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardMcpTest extends TestCase
{
    use CallsCatalogTools;
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
        $this->callCatalog($this->admin(), ListArticlesTool::class)
            ->assertOk();
    }

    public function test_home_page_layout_can_be_read_and_saved_through_mcp(): void
    {
        $this->callCatalog($this->admin(), GetHomePageLayoutTool::class)
            ->assertOk()
            ->assertSee('sections')
            ->assertSee('palette')
            ->assertSee('availableItems');

        $this->callCatalog($this->admin(), UpdateHomePageLayoutTool::class, ['sections' => []])
            ->assertOk()
            ->assertSee('success');
    }

    public function test_home_page_layout_write_rejects_invalid_section_types(): void
    {
        // A validation failure is data, not a transport error: the gateway
        // completes its batch, so the payload must report validation_failed.
        $this->callCatalog($this->admin(), UpdateHomePageLayoutTool::class, [
            'sections' => [['section_type' => 'not-a-section', 'is_active' => true]],
        ])
            ->assertOk()
            ->assertSee('validation_failed');
    }

    public function test_create_article_reports_validation_errors_to_the_caller(): void
    {
        // Sending an empty payload must surface the dashboard form's validation
        // errors rather than performing a partial write.
        $this->callCatalog($this->admin(), CreateArticleTool::class)
            ->assertOk()
            ->assertSee('validation_failed')
            ->assertSee('errors');
    }

    public function test_create_article_persists_through_the_existing_controller(): void
    {
        $this->callCatalog($this->admin(), CreateArticleTool::class, [
            'title' => 'Science Fair 2026',
            'body' => '<p>The annual science fair returns this spring.</p>',
            'is_published' => true,
        ])
            ->assertOk();

        $this->assertDatabaseHas('articles', ['title' => 'Science Fair 2026']);
    }

    public function test_create_article_supports_content_alias_and_defaults_published_and_language(): void
    {
        Language::query()->firstOrCreate(
            ['code' => 'fa_AF'],
            ['name' => 'Dari', 'dir' => 'rtl', 'is_default' => true, 'is_active' => true]
        );

        $this->callCatalog($this->admin(), CreateArticleTool::class, [
            'title' => 'AI Generated Article',
            'content' => '<p>Content written by an AI agent using content alias.</p>',
        ])
            ->assertOk()
            ->assertDontSee('validation_failed');

        $this->assertDatabaseHas('articles', [
            'title' => 'AI Generated Article',
            'is_published' => true,
            'language' => 'fa_AF',
        ]);
    }

    public function test_update_article_supports_partial_updates(): void
    {
        $admin = $this->admin();
        $article = Article::factory()->create([
            'title' => 'Original Title',
            'body' => '<p>Original body text</p>',
            'user_id' => $admin->id,
            'is_published' => false,
        ]);

        // Partial update: updating only the title
        $this->callCatalog($admin, UpdateArticleTool::class, [
            'article' => $article->id,
            'title' => 'Updated Article Title',
        ])
            ->assertOk()
            ->assertDontSee('validation_failed');

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'title' => 'Updated Article Title',
            'body' => '<p>Original body text</p>',
        ]);

        // Partial update: updating only is_published
        $this->callCatalog($admin, UpdateArticleTool::class, [
            'article' => $article->id,
            'is_published' => true,
        ])
            ->assertOk()
            ->assertDontSee('validation_failed');

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'title' => 'Updated Article Title',
            'is_published' => true,
        ]);
    }

    public function test_create_post_reports_validation_errors_on_empty_payload(): void
    {
        $this->callCatalog($this->admin(), CreatePostTool::class)
            ->assertOk()
            ->assertSee('validation_failed')
            ->assertSee('errors');
    }

    public function test_create_post_with_top_level_fields_and_defaults(): void
    {
        Language::query()->firstOrCreate(
            ['code' => 'fa_AF'],
            ['name' => 'Dari', 'dir' => 'rtl', 'is_default' => true, 'is_active' => true]
        );
        Language::query()->firstOrCreate(
            ['code' => 'en'],
            ['name' => 'English', 'dir' => 'ltr', 'is_default' => false, 'is_active' => true]
        );

        $admin = $this->admin();

        $this->callCatalog($admin, CreatePostTool::class, [
            'title' => 'School Championship Won',
            'content' => 'Our soccer team won the district cup today!',
            'type' => 'news',
        ])
            ->assertOk()
            ->assertDontSee('validation_failed');

        $post = Post::latest()->first();
        $this->assertNotNull($post);
        $this->assertSame($admin->id, $post->user_id);
        $this->assertSame('news', $post->type->value);
        $this->assertSame('public', $post->visibility->value);

        // Verify translations were populated for both default and active languages
        $this->assertDatabaseHas('post_translations', [
            'post_id' => $post->id,
            'title' => 'School Championship Won',
        ]);
    }

    public function test_update_post_supports_partial_updates(): void
    {
        $fa = Language::query()->firstOrCreate(
            ['code' => 'fa_AF'],
            ['name' => 'Dari', 'dir' => 'rtl', 'is_default' => true, 'is_active' => true]
        );

        $admin = $this->admin();
        $post = Post::query()->create([
            'user_id' => $admin->id,
            'type' => 'news',
            'visibility' => 'public',
            'featured' => false,
        ]);
        $post->translations()->create([
            'language_id' => $fa->id,
            'title' => 'Original Post Title',
            'content' => 'Original post content',
        ]);

        // Partial update: update title only
        $this->callCatalog($admin, UpdatePostTool::class, [
            'post' => $post->id,
            'title' => 'Updated Post Title',
        ])
            ->assertOk()
            ->assertDontSee('validation_failed');

        $this->assertDatabaseHas('post_translations', [
            'post_id' => $post->id,
            'title' => 'Updated Post Title',
            'content' => 'Original post content',
        ]);

        // Partial update: update featured only
        $this->callCatalog($admin, UpdatePostTool::class, [
            'post' => $post->id,
            'featured' => true,
        ])
            ->assertOk()
            ->assertDontSee('validation_failed');

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'featured' => true,
        ]);
    }

    public function test_route_role_middleware_is_replayed_for_mcp_callers(): void
    {
        // Email campaigns are admin-only in routes/web.php. A management account
        // must be blocked here exactly as it is in the browser, even though the
        // dispatcher calls the controller directly — and even through the
        // execute_tools gateway.
        $management = User::factory()->create(['role' => 'management', 'email_verified_at' => now()]);

        $this->callCatalog($management, ListEmailCampaignsTool::class)
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
