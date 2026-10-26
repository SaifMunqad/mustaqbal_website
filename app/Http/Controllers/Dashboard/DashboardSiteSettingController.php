<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\PreviewPaletteRequest;
use App\Http\Requests\Dashboard\UpdateSiteSettingRequest;
use App\Models\Font;
use App\Models\Language;
use App\Models\SiteSetting;
use App\Services\FaviconService;
use App\Support\Theme\BrandPalette;
use App\Support\Translation\TranslationPayload;
use App\Support\Typography\GoogleFonts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class DashboardSiteSettingController extends Controller
{
    public function __construct(private readonly FaviconService $favicons) {}

    /**
     * Branding colors are free-form hex on purpose (any school color), so they
     * are validated by shape and then normalized to lowercase.
     *
     * @var list<string>
     */
    private const COLOR_FIELDS = ['brand_color', 'accent_color'];

    public function edit(): Response
    {
        $setting = SiteSetting::current();
        $setting->load('translations.language');

        return Inertia::render('dashboard/site-settings/dashboard-site-settings-edit', [
            'settings' => $setting,
            'translations' => $this->existingTranslations($setting),
            'mapsKey' => config('services.google.maps_key'),
            'fonts' => $this->fontOptions(),
            'typography' => $this->typographyRows(),
            'googleFonts' => GoogleFonts::options(),
            'googleFontsHref' => GoogleFonts::previewHref(),
        ]);
    }

    /**
     * Uploaded font families for the typography editor, including their weight
     * files so the dashboard can preview each family without a second request.
     *
     * @return list<array<string, mixed>>
     */
    private function fontOptions(): array
    {
        return Font::query()
            ->with(['files', 'languages:id,code'])
            ->orderBy('name')
            ->get()
            ->map(fn (Font $font): array => [
                'id' => $font->id,
                'name' => $font->name,
                'family' => $font->cssFamily(),
                'stack' => $font->fontStack(),
                'files' => $font->faces(),
                'languages' => $font->languages->pluck('code')->values()->all(),
            ])
            ->all();
    }

    /**
     * Every language with the family it currently uses, so the typography
     * editor can render one select + preview per language.
     *
     * @return list<array<string, mixed>>
     */
    private function typographyRows(): array
    {
        return Language::query()
            ->orderByDesc('is_active')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Language $language): array => [
                'id' => $language->id,
                'code' => $language->code,
                'name' => $language->name,
                'dir' => $language->dir === 'rtl' ? 'rtl' : 'ltr',
                'is_active' => $language->is_active,
                'font_family_id' => $language->font_family_id,
                'google_font' => $language->google_font,
            ])
            ->all();
    }

    public function update(UpdateSiteSettingRequest $request): RedirectResponse
    {
        $section = $request->section();
        $validated = $request->validated();

        $setting = SiteSetting::resolved();
        $previousLogo = $setting->logo_url;

        // Non-localized columns live on the parent row only. `section` is just a
        // routing hint for partial saves and is never persisted.
        $setting->update($this->normalized(Arr::except($validated, ['translations', 'section'])));

        // The logo is the single source of truth for every system icon: rebuild
        // the favicon set whenever it changes (or the assets are missing), and
        // clear them entirely when the logo is removed so the fallback returns.
        // Only a save that carries the logo may trigger this, so editing an
        // unrelated section never rewrites the icon set.
        if ($section === null || in_array('logo_url', UpdateSiteSettingRequest::SECTIONS[$section], true)) {
            $newLogo = $setting->logo_url;
            if (filled($newLogo)) {
                if ($newLogo !== $previousLogo || ! $this->favicons->exists()) {
                    $this->favicons->regenerate($newLogo);
                }
            } elseif (filled($previousLogo)) {
                $this->favicons->clear();
            }
        }

        // Per-language payload: localized scalars limited to the submitted
        // section so a partial save cannot clear fields the admin never saw.
        $payload = $this->cleanedPayload($request, $section);
        $default = Language::defaultCode();

        // Mirror the default language back onto the parent (source of truth).
        $defaults = TranslationPayload::defaultAttributes($payload);
        $parentLocalized = [];
        foreach (UpdateSiteSettingRequest::LOCALIZED as $field) {
            if (array_key_exists($field, $defaults)) {
                $parentLocalized[$field] = $defaults[$field];
            }
        }
        if ($parentLocalized !== []) {
            $setting->update($parentLocalized);
        }

        // Persist every non-default language as a translation row.
        $secondary = collect($payload)
            ->except([$default])
            ->map(fn (array $fields): array => $this->cleanFields($fields))
            ->filter(fn (array $fields): bool => $fields !== [])
            ->all();

        TranslationPayload::apply($setting->translations(), $secondary);

        return redirect()
            ->route('dashboard.site-settings.edit')
            ->with('success', 'flash.siteSettingsUpdated');
    }

    /**
     * Derive a candidate palette for the live preview in the settings form, so
     * the OKLab/contrast math lives in exactly one place (PHP).
     */
    public function palette(PreviewPaletteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return response()->json(BrandPalette::preview(
            $validated['brand_color'] ?? null,
            $validated['accent_color'] ?? null,
            $validated['tint_depth'] ?? 'subtle',
        ));
    }

    /**
     * Extract the full localized payload, keyed by language.
     *
     * @return array<string, array<string, mixed>>
     */
    private function cleanedPayload(UpdateSiteSettingRequest $request, ?string $section = null): array
    {
        $fields = UpdateSiteSettingRequest::LOCALIZED;

        if ($section !== null) {
            $fields = array_values(array_intersect($fields, UpdateSiteSettingRequest::SECTIONS[$section]));
        }

        if ($fields === []) {
            return [];
        }

        return TranslationPayload::extract($request, $fields);
    }

    /**
     * Lowercase the stored hex colors so a palette string is stable regardless
     * of how it was typed or picked.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function normalized(array $values): array
    {
        foreach (self::COLOR_FIELDS as $field) {
            if (isset($values[$field]) && is_string($values[$field])) {
                $values[$field] = strtolower($values[$field]);
            }
        }

        return $values;
    }

    /**
     * Clean one language's fields, dropping blanks so an un-authored language
     * falls back to the parent instead of being stored as an empty row.
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function cleanFields(array $fields): array
    {
        return array_filter(
            $fields,
            static fn ($value): bool => is_array($value) ? $value !== [] : filled($value),
        );
    }

    /**
     * Existing translations keyed by `code -> field -> value`, for editor seeding.
     *
     * @return array<string, array<string, mixed>>
     */
    private function existingTranslations(SiteSetting $setting): array
    {
        return $setting->translations
            ->filter(fn ($translation) => $translation->language)
            ->mapWithKeys(fn ($translation): array => [
                $translation->language->code => Arr::only(
                    $translation->toArray(),
                    UpdateSiteSettingRequest::LOCALIZED,
                ),
            ])
            ->all();
    }
}
