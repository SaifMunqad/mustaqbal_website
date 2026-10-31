<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Mcp\Tools\AddPageSectionTool;
use App\Mcp\Tools\AssignLanguageFontTool;
use App\Mcp\Tools\DeleteFontTool;
use App\Mcp\Tools\GetAboutPageTool;
use App\Mcp\Tools\GetPageLayoutTool;
use App\Mcp\Tools\ListBuilderPagesTool;
use App\Mcp\Tools\RemovePageSectionTool;
use App\Mcp\Tools\ReorderPageSectionsTool;
use App\Mcp\Tools\UpdateAboutPageTool;
use App\Mcp\Tools\UpdatePageSectionTool;
use App\Mcp\Tools\UpdateWhatsAppSettingsTool;
use App\Mcp\Tools\UploadFontTool;
use App\Mcp\Tools\UploadMediaTool;
use App\Models\Font;
use App\Models\Language;
use App\Models\PageSection;
use App\Models\SitePage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Covers the MCP surface added for the visual page builder, file transfers,
 * typography and About-page publishing: the parts of the dashboard an agent
 * could not reach before.
 */
class PageBuilderMcpTest extends TestCase
{
    use CallsCatalogTools;
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

        Language::query()->create([
            'code' => 'en',
            'name' => 'English',
            'dir' => 'ltr',
            'is_active' => true,
            'is_default' => true,
            'sort_order' => 0,
        ]);
    }

    public function test_list_builder_pages_offers_the_three_visual_pages(): void
    {
        SchoolDashboardServer::actingAs($this->admin)
            ->tool(ListBuilderPagesTool::class, [])
            ->assertOk()
            ->assertStructuredContent(function ($content): void {
                $content->has('pages');
            });
    }

    /**
     * Every registered tool must resolve through the container and build its
     * input schema, so a broken constructor or malformed schema fails here —
     * not inside an agent client. The package's own list assertion cannot be
     * used because it instantiates tools without dependency injection.
     */
    public function test_every_registered_tool_schema_builds_cleanly(): void
    {
        $reflection = new \ReflectionClass(SchoolDashboardServer::class);

        /** @var array<int, class-string<\Laravel\Mcp\Server\Tool>> $tools */
        $tools = [];

        foreach ($reflection->getDefaultProperties()['tools'] as $entry) {
            // ToolSearch catalog groups are nested arrays; flatten them so the
            // lazy tools get the same schema scrutiny as the eager ones.
            foreach ((array) $entry as $class) {
                $tools[] = $class;
            }
        }

        $this->assertGreaterThanOrEqual(85, count($tools));

        $schema = new \Illuminate\JsonSchema\JsonSchemaTypeFactory;

        foreach ($tools as $class) {
            $tool = app($class);

            $built = $tool->schema($schema);

            $this->assertIsArray($built, "Schema of {$class} did not build.");
        }
    }

    public function test_about_and_contact_layouts_are_reachable_via_get_page_layout(): void
    {
        // Regression: the dispatcher used to pin defaulted scalar arguments to
        // their PHP default, so `page` could never leave "home".
        foreach (['about', 'contact'] as $page) {
            SchoolDashboardServer::actingAs($this->admin)
                ->tool(GetPageLayoutTool::class, ['page' => $page])
                ->assertOk()
                ->assertStructuredContent(function ($content) use ($page): void {
                    $content->has('sections')
                        ->has('palette')
                        ->has('categories')
                        ->has('availableItems')
                        ->has('defaultLanguage')
                        ->where('page', fn ($value): bool => $value['key'] === $page);
                });
        }
    }

    public function test_section_tools_run_a_full_add_update_reorder_remove_cycle(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        $server->tool(AddPageSectionTool::class, [
            'page' => 'home',
            'section' => [
                'section_type' => 'hero',
                'translations' => ['en' => ['title' => 'Welcome MCP']],
            ],
        ])->assertOk();

        $hero = PageSection::query()->where('section_type', 'hero')->firstOrFail();

        $server->tool(AddPageSectionTool::class, [
            'page' => 'home',
            'section' => ['section_type' => 'stats'],
        ])->assertOk();

        $stats = PageSection::query()->where('section_type', 'stats')->firstOrFail();

        // Patch only the title; untouched fields must survive the round-trip.
        $server->tool(UpdatePageSectionTool::class, [
            'page' => 'home',
            'id' => $hero->id,
            'patch' => ['translations' => ['en' => ['heading' => 'Raised by an agent']]],
        ])->assertOk();

        $this->assertDatabaseHas('page_section_translations', [
            'page_section_id' => $hero->id,
            'title' => 'Welcome MCP',
            'heading' => 'Raised by an agent',
        ]);

        // Reorder naming only the stats block must keep the hero after it,
        // never drop it.
        $server->tool(ReorderPageSectionsTool::class, [
            'page' => 'home',
            'ids' => [$stats->id],
        ])->assertOk();

        $ordered = PageSection::query()->where('page_id', $hero->page_id)->ordered()->pluck('id')->all();

        $this->assertSame([$stats->id, $hero->id], array_values($ordered));

        $server->tool(RemovePageSectionTool::class, ['page' => 'home', 'id' => $hero->id])
            ->assertOk();

        $this->assertDatabaseMissing('page_sections', ['id' => $hero->id]);
        $this->assertDatabaseHas('page_sections', ['id' => $stats->id]);
    }

    public function test_section_tools_reject_unknown_pages_and_ids(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        $server->tool(AddPageSectionTool::class, [
            'page' => 'nonsense',
            'section' => ['section_type' => 'hero'],
        ])->assertHasErrors();

        $server->tool(UpdatePageSectionTool::class, [
            'page' => 'home',
            'id' => 999999,
            'patch' => ['zone' => 'x'],
        ])->assertHasErrors();
    }

    public function test_upload_media_transfers_base64_images_through_the_dashboard_uploader(): void
    {
        Storage::fake('public');

        // 1x1 transparent PNG, as the base64 payload an agent would send.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool(UploadMediaTool::class, [
                'base64' => 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                'filename' => 'agent-hero.png',
            ])
            ->assertOk()
            ->assertStructuredContent(function ($content): void {
                $content->where('url', fn ($value): bool => is_string($value) && str_starts_with($value, '/storage/uploads/'))
                    ->has('path');
            });
    }

    public function test_font_upload_and_language_assignment_work_through_mcp(): void
    {
        Storage::fake('public');

        // Minimal TrueType header (the FontFile rule checks magic bytes).
        $ttf = base64_encode("\x00\x01\x00\x00".str_repeat("\x00", 64));

        $this->callCatalog($this->admin, UploadFontTool::class, [
            'name' => 'Agent Serif',
            'files' => [
                '400' => ['base64' => $ttf, 'filename' => 'agent-serif.ttf'],
            ],
        ])->assertOk();

        $font = Font::query()->where('slug', 'agent-serif')->firstOrFail();

        $language = Language::query()->where('code', 'en')->firstOrFail();

        $this->callCatalog($this->admin, AssignLanguageFontTool::class, [
            'language' => $language->id,
            'selection' => 'font:'.$font->id,
        ])->assertOk();

        $this->assertSame($font->id, $language->fresh()->font_family_id);

        // Deletion must be refused while a language still points at the family.
        $this->callCatalog($this->admin, DeleteFontTool::class, ['font' => $font->id])
            ->assertOk();

        $this->assertDatabaseHas('fonts', ['id' => $font->id]);

        $this->callCatalog($this->admin, AssignLanguageFontTool::class, [
            'language' => $language->id,
            'selection' => 'default',
        ])->assertOk();

        $this->callCatalog($this->admin, DeleteFontTool::class, ['font' => $font->id])
            ->assertOk();

        $this->assertDatabaseMissing('fonts', ['id' => $font->id]);
    }

    public function test_about_page_publication_can_be_read_and_toggled(): void
    {
        $this->callCatalog($this->admin, GetAboutPageTool::class)
            ->assertOk();

        $this->callCatalog($this->admin, UpdateAboutPageTool::class, ['is_published' => false])
            ->assertOk();

        $this->assertFalse((bool) SitePage::query()->where('slug', 'about')->value('is_published'));
    }

    public function test_management_role_can_edit_builder_pages_but_not_whatsapp_settings(): void
    {
        $management = User::factory()->create(['role' => 'management', 'email_verified_at' => now()]);

        // Builder routes are role:management — allowed.
        SchoolDashboardServer::actingAs($management)
            ->tool(AddPageSectionTool::class, [
                'page' => 'contact',
                'section' => ['section_type' => 'rich_text'],
            ])
            ->assertOk();

        // WhatsApp settings routes are role:admin — blocked, as in the browser.
        $this->callCatalog($management, UpdateWhatsAppSettingsTool::class, ['graph_version' => 'v23.0'])
            ->assertHasErrors();
    }
}
