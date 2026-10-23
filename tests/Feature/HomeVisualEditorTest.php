<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\HomeSection;
use App\Models\Language;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Covers the visual home-page editor: access gating, the fallback-free draft
 * feed, and the batched save (create / update / reorder / delete) plus the rule
 * that a blank non-default translation must not overwrite the fallback.
 */
class HomeVisualEditorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The editor page renders the Inertia root view; stub Vite so tests
        // don't depend on a compiled manifest for the new page chunk.
        $this->withoutVite();

        // Build a controlled en(default)+ps fixture: clear the language the
        // languages migration seeds by default so it is not an unexpected extra
        // active language that would shift the resolved default off English.
        Language::query()->delete();

        Language::flushCache();

        $this->language('en', true);
        $this->language('ps', false);
    }

    public function test_guests_are_redirected(): void
    {
        $this->get(route('dashboard.home-sections.visual'))->assertRedirect(route('login'));
    }

    public function test_non_management_roles_are_forbidden(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Family->value]))
            ->get(route('dashboard.home-sections.visual'))
            ->assertForbidden();
    }

    public function test_save_layout_creates_updates_reorders_and_deletes(): void
    {
        $a = $this->section('banner', true, 0);
        $b = $this->section('announcement', true, 1);
        $c = $this->section('articles', true, 2);

        $payload = [
            'sections' => [
                // Update existing $b (reorder to first) with new English text.
                [
                    'id' => $b->id,
                    'section_type' => 'announcement',
                    'is_active' => true,
                    'limit' => null,
                    'config' => ['item_ids' => [], 'image_url' => '', 'cta_url' => '', 'tone' => 'default'],
                    'translations' => ['en' => ['heading' => 'Updated notice']],
                ],
                // Update existing $a (move to second).
                [
                    'id' => $a->id,
                    'section_type' => 'banner',
                    'is_active' => true,
                    'limit' => null,
                    'config' => ['item_ids' => [], 'image_url' => '', 'cta_url' => '', 'tone' => 'blue'],
                    'translations' => ['en' => ['heading' => 'Hello world']],
                ],
                // Create a brand-new curated section (no id).
                [
                    'id' => null,
                    'section_type' => 'events',
                    'is_active' => false,
                    'limit' => 4,
                    'config' => ['item_ids' => [1, 2], 'image_url' => '', 'cta_url' => '', 'tone' => 'default'],
                    'translations' => ['en' => ['title' => 'Upcoming events']],
                ],
                // $c is intentionally omitted → must be deleted.
            ],
        ];

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.home-sections.visual.save'), $payload)
            ->assertRedirect();

        // Removed + reordered (b, then a, then the newly created block).
        $this->assertDatabaseMissing('home_sections', ['id' => $c->id]);
        $this->assertSame([$b->id, $a->id], HomeSection::ordered()->pluck('id')->take(2)->all());

        $this->assertSame(0, $b->fresh()->sort_order);
        $this->assertSame(1, $a->fresh()->sort_order);

        // Updated translations are persisted.
        $this->assertDatabaseHas('home_section_translations', [
            'home_section_id' => $b->id,
            'heading' => 'Updated notice',
        ]);
        $this->assertSame('blue', $a->fresh()->config['tone']);

        // New section created with its config.
        $fresh = HomeSection::where('section_type', 'events')->first();
        $this->assertNotNull($fresh);
        $this->assertFalse($fresh->is_active);
        $this->assertSame([1, 2], $fresh->config['item_ids']);
    }

    public function test_blank_optional_translation_does_not_overwrite_the_fallback(): void
    {
        $en = Language::where('code', 'en')->first();

        $section = $this->section('banner', true, 0);
        $section->translations()->create(['language_id' => $en->id, 'heading' => 'English heading']);

        // Admin submits an empty Pashto heading (and empty en) — blanks must be
        // dropped, never written as the default language's text.
        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.home-sections.visual.save'), [
                'sections' => [
                    [
                        'id' => $section->id,
                        'section_type' => 'banner',
                        'is_active' => true,
                        'limit' => null,
                        'config' => ['item_ids' => [], 'image_url' => '', 'cta_url' => '', 'tone' => 'default'],
                        'translations' => [
                            'en' => ['heading' => 'English heading'],
                            'ps' => ['heading' => '   '],
                        ],
                    ],
                ],
            ])
            ->assertRedirect();

        $ps = Language::where('code', 'ps')->first();

        // No Pashto row was created from the blank submission.
        $this->assertDatabaseMissing('home_section_translations', [
            'home_section_id' => $section->id,
            'language_id' => $ps->id,
        ]);

        // The live site still falls back to English for the Pashto locale.
        $this->assertSame(
            'English heading',
            $section->fresh(['translations.language'])->translated('heading', 'ps'),
        );
    }

    public function test_save_layout_persists_site_blocks(): void
    {
        $ps = Language::where('code', 'ps')->first();

        $this->actingAs(User::factory()->create(['role' => UserRole::Management->value]))
            ->put(route('dashboard.home-sections.visual.save'), [
                'sections' => [],
                'site' => [
                    'hero_image' => '/storage/uploads/hero.jpg',
                    'translations' => [
                        'en' => [
                            'home_title' => 'Welcome EN',
                            'home_stats' => [['value' => '100+', 'label' => 'Students']],
                            'home_features' => [['icon' => 'faculty', 'title' => 'Faculty', 'description' => 'Great teachers']],
                        ],
                        'ps' => ['home_title' => 'ښه راغلاست PS'],
                    ],
                ],
            ])
            ->assertRedirect();

        // Default language mirrors onto the parent row (source of truth).
        $setting = SiteSetting::current();
        $this->assertSame('Welcome EN', $setting->home_title);
        $this->assertSame('/storage/uploads/hero.jpg', $setting->home_hero_image);
        $this->assertSame('Students', $setting->home_stats[0]['label']);
        $this->assertSame('Faculty', $setting->home_features[0]['title']);

        // Non-default language persists as its own translation row.
        $this->assertDatabaseHas('site_setting_translations', [
            'language_id' => $ps->id,
            'home_title' => 'ښه راغلاست PS',
        ]);
    }

    private function language(string $code, bool $isDefault): Language
    {
        return Language::query()->create([
            'code' => $code,
            'name' => strtoupper($code),
            'dir' => $code === 'ps' ? 'rtl' : 'ltr',
            'is_active' => true,
            'is_default' => $isDefault,
            'sort_order' => $isDefault ? 0 : 1,
        ]);
    }

    private function section(string $type, bool $active, int $order): HomeSection
    {
        return HomeSection::query()->create([
            'section_type' => $type,
            'is_active' => $active,
            'sort_order' => $order,
            'config' => [],
        ]);
    }
}
