<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Font;
use App\Models\Language;
use App\Models\User;
use App\Support\Typography\GoogleFonts;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TypographyTest extends TestCase
{
    use RefreshDatabase;

    private function staff(UserRole $role = UserRole::Management): User
    {
        return User::factory()->create(['role' => $role->value]);
    }

    /**
     * @param  list<int>  $weights
     */
    private function font(array $weights = [400, 700], string $name = 'B Nazanin'): Font
    {
        $font = Font::query()->create([
            'name' => $name,
            'slug' => str($name)->slug()->toString(),
        ]);

        foreach ($weights as $weight) {
            $font->files()->create([
                'weight' => $weight,
                'style' => 'normal',
                'path' => "fonts/{$font->slug}/{$weight}.woff2",
                'format' => 'woff2',
            ]);
        }

        return $font;
    }

    private function defaultLanguage(): Language
    {
        return Language::query()->where('is_default', true)->firstOrFail();
    }

    public function test_management_can_upload_a_font_family(): void
    {
        Storage::fake('public');

        $this->actingAs($this->staff())
            ->post(route('dashboard.typography.fonts.store'), [
                'name' => 'B Nazanin',
                'files' => [
                    400 => UploadedFile::fake()->createWithContent('regular.woff2', "wOF2\0\0\0\0"),
                    700 => UploadedFile::fake()->createWithContent('bold.woff2', "wOF2\0\0\0\0"),
                ],
            ])
            ->assertRedirect();

        $font = Font::query()->where('slug', 'b-nazanin')->firstOrFail();

        $this->assertSame(2, $font->files()->count());
        $this->assertSame(
            ['woff2'],
            $font->files()->distinct()->pluck('format')->all(),
        );
        Storage::disk('public')->assertExists('fonts/b-nazanin/400.woff2');
        Storage::disk('public')->assertExists('fonts/b-nazanin/700.woff2');
    }

    public function test_upload_rejects_a_file_that_is_not_a_font(): void
    {
        Storage::fake('public');

        $this->actingAs($this->staff())
            ->post(route('dashboard.typography.fonts.store'), [
                'name' => 'Fake Font',
                'files' => [
                    400 => UploadedFile::fake()->createWithContent('regular.woff2', 'plain text, not a font'),
                ],
            ])
            ->assertSessionHasErrors('files.400');

        $this->assertSame(0, Font::query()->count());
    }

    public function test_upload_rejects_a_duplicate_family_name(): void
    {
        Storage::fake('public');
        $this->font();

        $this->actingAs($this->staff())
            ->post(route('dashboard.typography.fonts.store'), [
                'name' => 'B Nazanin',
                'files' => [
                    400 => UploadedFile::fake()->createWithContent('regular.woff2', "wOF2\0\0\0\0"),
                ],
            ])
            ->assertSessionHasErrors('name');

        $this->assertSame(1, Font::query()->count());
    }

    public function test_only_management_can_upload_fonts(): void
    {
        Storage::fake('public');

        $this->actingAs($this->staff(UserRole::Teacher))
            ->post(route('dashboard.typography.fonts.store'), [
                'name' => 'B Nazanin',
                'files' => [
                    400 => UploadedFile::fake()->createWithContent('regular.woff2', "wOF2\0\0\0\0"),
                ],
            ])
            ->assertForbidden();
    }

    public function test_assigning_a_family_renders_its_font_faces_on_the_site(): void
    {
        Storage::fake('public');
        $font = $this->font();
        $language = $this->defaultLanguage();

        $this->actingAs($this->staff())
            ->put(route('dashboard.typography.languages.update', $language), [
                'selection' => 'font:'.$font->id,
            ])
            ->assertRedirect();

        $this->assertSame($font->id, $language->fresh()->font_family_id);

        $this->get('/')
            ->assertOk()
            ->assertSee('--app-font-active', false)
            ->assertSee("@font-face{font-family:'B Nazanin'", false);
    }

    public function test_assigning_a_google_font_links_its_stylesheet(): void
    {
        $language = $this->defaultLanguage();

        $this->actingAs($this->staff())
            ->put(route('dashboard.typography.languages.update', $language), [
                'selection' => 'google:rubik',
            ])
            ->assertRedirect();

        $this->assertSame('rubik', $language->fresh()->google_font);

        $this->get('/')
            ->assertOk()
            ->assertSee('fonts.googleapis.com/css2', false)
            ->assertSee('family=Rubik:wght@400;500;700', false)
            ->assertSee("--app-font-active:'Rubik'", false)
            // Nothing is uploaded, so there are no @font-face rules to emit.
            ->assertDontSee("@font-face{font-family:'Rubik'", false);
    }

    public function test_google_and_uploaded_selections_are_mutually_exclusive(): void
    {
        Storage::fake('public');
        $font = $this->font();
        $language = $this->defaultLanguage();

        $this->actingAs($this->staff())
            ->put(route('dashboard.typography.languages.update', $language), [
                'selection' => 'google:inter',
            ]);

        $language->refresh();
        $this->assertSame('inter', $language->google_font);
        $this->assertNull($language->font_family_id);

        $this->actingAs($this->staff())
            ->put(route('dashboard.typography.languages.update', $language), [
                'selection' => 'font:'.$font->id,
            ]);

        $language->refresh();
        $this->assertNull($language->google_font);
        $this->assertSame($font->id, $language->font_family_id);

        $this->actingAs($this->staff())
            ->put(route('dashboard.typography.languages.update', $language), [
                'selection' => 'default',
            ]);

        $language->refresh();
        $this->assertNull($language->google_font);
        $this->assertNull($language->font_family_id);
    }

    public function test_an_unknown_google_font_is_rejected(): void
    {
        $language = $this->defaultLanguage();

        $this->actingAs($this->staff())
            ->put(route('dashboard.typography.languages.update', $language), [
                'selection' => 'google:comic-sans',
            ])
            ->assertSessionHasErrors('selection');

        $this->assertNull($language->fresh()->google_font);
    }

    public function test_the_google_catalog_offers_at_least_ten_arabic_script_families(): void
    {
        $options = GoogleFonts::options();
        $arabic = array_values(array_filter($options, static fn (array $font): bool => $font['arabic']));

        $this->assertGreaterThanOrEqual(10, count($arabic));
        $this->assertContains('cairo', array_column($arabic, 'key'));
        $this->assertContains('amiri', array_column($arabic, 'key'));
        $this->assertContains('noto-kufi-arabic', array_column($arabic, 'key'));

        // Arabic-script families are listed first so the picker leads with them.
        $this->assertTrue($options[0]['arabic']);

        // Dashboard previews only pull the regular weight of every family.
        $this->assertStringContainsString('family=Cairo:wght@400&', GoogleFonts::previewHref());
    }

    public function test_an_arabic_google_font_renders_its_stylesheet(): void
    {
        $language = $this->defaultLanguage();

        $this->actingAs($this->staff())
            ->put(route('dashboard.typography.languages.update', $language), [
                'selection' => 'google:cairo',
            ])
            ->assertRedirect();

        $this->get('/')
            ->assertOk()
            ->assertSee('family=Cairo:wght@400;600;700', false)
            ->assertSee("--app-font-active:'Cairo'", false);
    }

    public function test_languages_without_a_family_use_the_built_in_stack(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertDontSee('--app-font-active', false);
    }

    public function test_a_family_in_use_cannot_be_deleted(): void
    {
        Storage::fake('public');
        $font = $this->font();
        $language = $this->defaultLanguage();
        $language->update(['font_family_id' => $font->id]);

        $this->actingAs($this->staff())
            ->delete(route('dashboard.typography.fonts.destroy', $font))
            ->assertRedirect();

        $this->assertDatabaseHas('fonts', ['id' => $font->id]);
    }

    public function test_an_unused_family_is_deleted_with_its_files(): void
    {
        Storage::fake('public');
        $font = $this->font();
        Storage::disk('public')->put('fonts/b-nazanin/400.woff2', 'wOF2');

        $this->actingAs($this->staff())
            ->delete(route('dashboard.typography.fonts.destroy', $font))
            ->assertRedirect();

        $this->assertDatabaseMissing('fonts', ['id' => $font->id]);
        $this->assertDatabaseCount('font_files', 0);
        Storage::disk('public')->assertMissing('fonts/b-nazanin/400.woff2');
    }
}
