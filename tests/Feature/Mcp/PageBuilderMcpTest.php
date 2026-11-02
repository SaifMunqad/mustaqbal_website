<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

use App\Mcp\Servers\SchoolDashboardServer;
use App\Mcp\Tools\AddPageSectionTool;
use App\Mcp\Tools\AssignLanguageFontTool;
use App\Mcp\Tools\DeleteFontTool;
use App\Mcp\Tools\EditPageSectionTool;
use App\Mcp\Tools\EditSiteSettingsTool;
use App\Mcp\Tools\GetAboutPageTool;
use App\Mcp\Tools\GetPageLayoutTool;
use App\Mcp\Tools\GetPageSectionTool;
use App\Mcp\Tools\GetSiteSettingsTool;
use App\Mcp\Tools\GetSiteSettingsSectionTool;
use App\Mcp\Tools\ListBuilderPagesTool;
use App\Mcp\Tools\RemovePageSectionTool;
use App\Mcp\Tools\ReorderPageSectionsTool;
use App\Mcp\Tools\UpdateAboutPageTool;
use App\Mcp\Tools\UpdatePageLayoutTool;
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

    public function test_add_page_section_exposes_and_uses_a_section_type_choice(): void
    {
        $schema = new \Illuminate\JsonSchema\JsonSchemaTypeFactory;
        $toolSchema = app(AddPageSectionTool::class)->schema($schema);

        $this->assertSame(\App\Enums\SectionType::values(), $toolSchema['section_type']->toArray()['enum']);

        SchoolDashboardServer::actingAs($this->admin)
            ->tool(AddPageSectionTool::class, [
                'page' => 'home',
                'section_type' => 'banner',
                'section' => ['section_type' => 'hero'],
            ])
            ->assertOk();

        $this->assertDatabaseHas('page_sections', ['section_type' => 'banner']);
        $this->assertDatabaseMissing('page_sections', ['section_type' => 'hero']);
    }

    public function test_edit_page_section_updates_by_position_and_section_name(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        $server->tool(AddPageSectionTool::class, [
            'page' => 'home',
            'section' => ['section_type' => 'hero', 'translations' => ['en' => ['heading' => 'Before']]],
        ])->assertOk();

        $section = PageSection::query()->firstOrFail();

        $server->tool(EditPageSectionTool::class, [
            'page' => 'home',
            'position' => 0,
            'section_name' => 'Hero',
            'field' => 'heading',
            'language' => 'en',
            'value' => 'After',
        ])->assertOk();

        $this->assertDatabaseHas('page_section_translations', [
            'page_section_id' => $section->id,
            'heading' => 'After',
        ]);

        $server->tool(EditPageSectionTool::class, [
            'page' => 'home',
            'position' => 0,
            'section_name' => 'Banner',
            'field' => 'tone',
            'value' => 'blue',
        ])->assertHasErrors();
    }

    public function test_edit_page_section_updates_multiple_languages_at_once(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        Language::query()->create([
            'code' => 'ar',
            'name' => 'Arabic',
            'dir' => 'rtl',
            'is_active' => true,
            'is_default' => false,
            'sort_order' => 1,
        ]);

        $server->tool(AddPageSectionTool::class, [
            'page' => 'home',
            'section' => ['section_type' => 'hero'],
        ])->assertOk();

        $section = PageSection::query()->firstOrFail();

        $server->tool(EditPageSectionTool::class, [
            'page' => 'home',
            'position' => 0,
            'section_name' => 'Hero',
            'translations' => [
                'en' => ['heading' => 'Welcome'],
                'ar' => ['heading' => 'أهلاً وسهلاً'],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('page_section_translations', [
            'page_section_id' => $section->id,
            'heading' => 'Welcome',
        ]);
        $this->assertDatabaseHas('page_section_translations', [
            'page_section_id' => $section->id,
            'heading' => 'أهلاً وسهلاً',
        ]);
    }

    public function test_get_page_section_returns_selected_section_and_rejects_stale_name(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        $server->tool(AddPageSectionTool::class, [
            'page' => 'home',
            'section' => ['section_type' => 'hero', 'translations' => ['en' => ['heading' => 'Welcome']]],
        ])->assertOk();

        $server->tool(GetPageSectionTool::class, [
            'page' => 'home',
            'position' => 0,
            'section_type' => 'hero',
        ])->assertOk()->assertStructuredContent(function ($content): void {
            $content->has('page')
                ->has('position')
                ->has('section')
                ->where('section', fn ($section): bool => $section['section_type'] === 'hero'
                    && $section['translations']['en']['heading'] === 'Welcome');
        });

        $server->tool(GetPageSectionTool::class, [
            'page' => 'home',
            'position' => 0,
            'section_type' => 'banner',
        ])->assertHasErrors();
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
                    $content->has('page')
                        ->has('sections')
                        ->where('page.key', $page)
                        ->missing('palette')
                        ->missing('categories')
                        ->missing('availableItems');
                });
        }
    }

    public function test_page_layout_returns_structure_without_section_values(): void
    {
        SchoolDashboardServer::actingAs($this->admin)
            ->tool(AddPageSectionTool::class, [
                'page' => 'home',
                'section' => ['section_type' => 'hero', 'translations' => ['en' => ['heading' => 'Private section text']]],
            ])->assertOk();

        SchoolDashboardServer::actingAs($this->admin)
            ->tool(GetPageLayoutTool::class, ['page' => 'home'])
            ->assertOk()
            ->assertStructuredContent(function ($content): void {
                $content->has('page')
                    ->where('sections.0.position', 0)
                    ->where('sections.0.section_type', 'hero')
                    ->missing('sections.0.translations')
                    ->missing('palette');
            });
    }

    public function test_site_settings_can_be_read_and_edited_by_group(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        $server->tool(GetSiteSettingsTool::class, [])
            ->assertOk()
            ->assertStructuredContent(fn ($content) => $content->has('groups'));

        $server->tool(GetSiteSettingsSectionTool::class, ['section' => 'appearance'])
            ->assertOk()
            ->assertStructuredContent(fn ($content) => $content->where('section', 'appearance')->has('fields')->has('translations'));

        $server->tool(EditSiteSettingsTool::class, ['section' => 'contact', 'contact_email' => 'hello@example.com'])
            ->assertOk();

        $this->assertDatabaseHas('site_settings', ['contact_email' => 'hello@example.com']);

        $schema = new \Illuminate\JsonSchema\JsonSchemaTypeFactory;
        $this->assertArrayHasKey('section', app(EditSiteSettingsTool::class)->schema($schema));
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

    /**
     * The reported data-loss scenario at the MCP layer: an agent submitting
     * only the block it touched must never delete the rest of the page.
     */
    public function test_partial_update_page_layout_keeps_unmentioned_sections(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        $server->tool(AddPageSectionTool::class, [
            'page' => 'home',
            'section' => ['section_type' => 'hero', 'translations' => ['en' => ['title' => 'Survivor']]],
        ])->assertOk();

        $server->tool(AddPageSectionTool::class, [
            'page' => 'home',
            'section' => ['section_type' => 'banner'],
        ])->assertOk();

        $banner = PageSection::query()->where('section_type', 'banner')->firstOrFail();

        // A partial layout: just the banner, restyled.
        $server->tool(UpdatePageLayoutTool::class, [
            'page' => 'home',
            'sections' => [['id' => $banner->id, 'section_type' => 'banner', 'is_active' => true, 'tone' => 'green']],
        ])->assertOk();

        $this->assertDatabaseHas('page_sections', ['id' => $banner->id, 'tone' => 'green']);
        $this->assertDatabaseHas('page_sections', ['section_type' => 'hero']);
        $this->assertSame(2, PageSection::query()->count());
    }

    public function test_remove_missing_true_still_replaces_the_whole_layout(): void
    {
        $server = SchoolDashboardServer::actingAs($this->admin);

        $server->tool(AddPageSectionTool::class, ['page' => 'home', 'section' => ['section_type' => 'hero']])
            ->assertOk();
        $server->tool(AddPageSectionTool::class, ['page' => 'home', 'section' => ['section_type' => 'banner']])
            ->assertOk();

        $banner = PageSection::query()->where('section_type', 'banner')->firstOrFail();

        $server->tool(UpdatePageLayoutTool::class, [
            'page' => 'home',
            'sections' => [['id' => $banner->id, 'section_type' => 'banner', 'is_active' => true]],
            'remove_missing' => true,
        ])->assertOk();

        $this->assertDatabaseMissing('page_sections', ['section_type' => 'hero']);
        $this->assertDatabaseHas('page_sections', ['id' => $banner->id]);
    }

    public function test_unknown_translation_codes_fail_loudly_over_mcp(): void
    {
        // The MCP surface only knows "en" here; a guessed code must produce a
        // validation error instead of a success with silently dropped text.
        SchoolDashboardServer::actingAs($this->admin)
            ->tool(UpdatePageLayoutTool::class, [
                'page' => 'home',
                'sections' => [['section_type' => 'rich_text', 'is_active' => true, 'translations' => ['fa' => ['body' => 'lost text']]]],
            ])
            ->assertOk()
            ->assertStructuredContent(function ($content): void {
                $content->has('errors')->where('status', 'validation_failed');
            });

        $this->assertDatabaseCount('page_sections', 0);
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
