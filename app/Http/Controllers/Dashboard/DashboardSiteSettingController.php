<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Language;
use App\Models\SiteSetting;
use App\Services\FaviconService;
use App\Support\Rules\ImageLocation;
use App\Support\Theme\BrandPalette;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardSiteSettingController extends Controller
{
    public function __construct(private readonly FaviconService $favicons) {}

    /**
     * Localized scalar fields edited per language. The home stats/features lists
     * are localized separately (see {@see LIST_FIELDS}).
     *
     * @var list<string>
     */
    private const LOCALIZED = [
        'brand_name',
        'brand_short_name',
        'tagline',
        'home_title',
        'home_subtitle',
        'home_cta_primary',
        'home_cta_secondary',
        'footer_text',
    ];

    /**
     * Localized fields that must be filled for the default language, since the
     * parent mirrors them as the non-null source of truth (branding columns).
     *
     * @var list<string>
     */
    private const REQUIRED_FOR_DEFAULT = ['brand_name', 'brand_short_name'];

    /**
     * Localized JSON list fields (quick-stats bar + feature grid).
     *
     * @var list<string>
     */
    private const LIST_FIELDS = ['home_stats', 'home_features'];

    /**
     * Editable sections of the settings page. Each entry lists the fields saved
     * (and validated) together, so the dashboard can persist one section without
     * resubmitting every other field on the page.
     *
     * @var array<string, list<string>>
     */
    private const SECTIONS = [
        'identity' => [
            'logo_url', 'reverse_logo_url',
            'brand_name', 'brand_short_name', 'tagline', 'footer_text',
        ],
        'appearance' => ['brand_color', 'accent_color', 'tint_depth'],
        'home' => [
            'home_hero_image',
            'home_title', 'home_subtitle', 'home_cta_primary', 'home_cta_secondary',
            'home_stats', 'home_features',
        ],
        'contact' => [
            'contact_email', 'contact_phone_primary', 'contact_phone_secondary',
            'address', 'map_latitude', 'map_longitude', 'map_zoom', 'map_embed_url',
        ],
        'social' => [
            'social_facebook', 'social_instagram', 'social_twitter',
            'social_youtube', 'social_whatsapp',
        ],
    ];

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
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $section = $this->resolveSection($request);
        $validated = $request->validate($this->rules($section));

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
        if ($section === null || in_array('logo_url', self::SECTIONS[$section], true)) {
            $newLogo = $setting->logo_url;
            if (filled($newLogo)) {
                if ($newLogo !== $previousLogo || ! $this->favicons->exists()) {
                    $this->favicons->regenerate($newLogo);
                }
            } elseif (filled($previousLogo)) {
                $this->favicons->clear();
            }
        }

        // Per-language payload: localized scalars + the JSON lists, limited to
        // the submitted section so a partial save cannot clear fields the admin
        // never saw.
        $payload = $this->cleanedPayload($request, $section);
        $default = Language::defaultCode();

        // Mirror the default language back onto the parent (source of truth).
        $defaults = TranslationPayload::defaultAttributes($payload);
        $parentLocalized = [];
        foreach (self::LOCALIZED as $field) {
            if (array_key_exists($field, $defaults)) {
                $parentLocalized[$field] = $defaults[$field];
            }
        }
        foreach (self::LIST_FIELDS as $field) {
            if (array_key_exists($field, $defaults)) {
                $parentLocalized[$field] = $this->cleanList($field, $defaults[$field]);
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
     * The section this request saves. A missing or unknown name means "the whole
     * form", which keeps single-payload clients (and older callers) working.
     */
    private function resolveSection(Request $request): ?string
    {
        $section = $request->input('section');

        return is_string($section) && isset(self::SECTIONS[$section]) ? $section : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?string $section = null): array
    {
        $codes = collect(Language::activeList())->pluck('code')->all();
        $default = Language::defaultCode();

        $scalarRules = [
            'brand_name' => ['string', 'max:255'],
            'brand_short_name' => ['string', 'max:100'],
            'tagline' => ['string', 'max:255'],
            'home_title' => ['string', 'max:255'],
            'home_subtitle' => ['string', 'max:2000'],
            'home_cta_primary' => ['string', 'max:255'],
            'home_cta_secondary' => ['string', 'max:255'],
            'footer_text' => ['string', 'max:255'],
        ];

        // Per-language rules are optional except for branding on the default
        // language, whose parent columns are non-null (source of truth); other
        // languages fall back to the parent when left blank.
        $localizedRules = ['translations' => ['nullable', 'array']];
        foreach ($codes as $code) {
            foreach (self::LOCALIZED as $field) {
                $isRequiredDefault = $code === $default
                    && in_array($field, self::REQUIRED_FOR_DEFAULT, true);

                $localizedRules["translations.$code.$field"] = [
                    ...$scalarRules[$field],
                    $isRequiredDefault ? 'required' : 'nullable',
                ];
            }

            $localizedRules["translations.$code.home_stats"] = ['nullable', 'array'];
            $localizedRules["translations.$code.home_stats.*.value"] = ['nullable', 'string', 'max:60'];
            $localizedRules["translations.$code.home_stats.*.label"] = ['nullable', 'string', 'max:120'];
            $localizedRules["translations.$code.home_features"] = ['nullable', 'array'];
            $localizedRules["translations.$code.home_features.*.icon"] = ['nullable', 'string', 'max:40'];
            $localizedRules["translations.$code.home_features.*.title"] = ['nullable', 'string', 'max:120'];
            $localizedRules["translations.$code.home_features.*.description"] = ['nullable', 'string', 'max:500'];
        }

        $rules = array_merge([
            // Optional section name: when present only that section's fields are
            // validated and persisted, so one save never blocks on (or clears)
            // another section's fields. Absent means "validate the whole form".
            'section' => ['nullable', Rule::in(array_keys(self::SECTIONS))],

            // Brand assets (shared across languages). The favicon is derived
            // automatically from the logo (see FaviconService) and no longer
            // uploaded separately.
            'logo_url' => ['nullable', new ImageLocation, 'max:2048'],
            'reverse_logo_url' => ['nullable', new ImageLocation, 'max:2048'],
            'home_hero_image' => ['nullable', new ImageLocation, 'max:2048'],

            // Branding palette inputs. Everything else (mid tones, deep bands,
            // dark-mode twins, ink) is derived by BrandPalette.
            'brand_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'accent_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'tint_depth' => ['nullable', Rule::in(['subtle', 'medium', 'bold'])],

            // Contact details (shared).
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone_primary' => ['nullable', 'string', 'max:100'],
            'contact_phone_secondary' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'map_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'map_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'map_zoom' => ['nullable', 'integer', 'between:1,21'],
            'map_embed_url' => ['nullable', 'url', 'max:2048'],

            // Social links (shared).
            'social_facebook' => ['nullable', 'url', 'max:2048'],
            'social_instagram' => ['nullable', 'url', 'max:2048'],
            'social_twitter' => ['nullable', 'url', 'max:2048'],
            'social_youtube' => ['nullable', 'url', 'max:2048'],
            'social_whatsapp' => ['nullable', 'string', 'max:255'],
        ], $localizedRules);

        return $section === null ? $rules : $this->onlySection($rules, $section);
    }

    /**
     * Reduce the full rule set to one section's fields. `translations.*` keys are
     * matched on the localized field name, and the `translations` container rules
     * only apply when the section actually carries localized fields.
     *
     * @param  array<string, mixed>  $rules
     * @return array<string, mixed>
     */
    private function onlySection(array $rules, string $section): array
    {
        $fields = self::SECTIONS[$section];
        $localized = array_intersect($fields, [...self::LOCALIZED, ...self::LIST_FIELDS]);

        return array_filter(
            $rules,
            static function (string $key) use ($fields, $localized): bool {
                if ($key === 'section') {
                    return true;
                }

                if (! str_starts_with($key, 'translations')) {
                    return in_array($key, $fields, true);
                }

                $parts = explode('.', $key);

                return count($parts) < 3
                    ? $localized !== []
                    : in_array($parts[2], $fields, true);
            },
            ARRAY_FILTER_USE_KEY,
        );
    }

    /**
     * Derive a candidate palette for the live preview in the settings form, so
     * the OKLab/contrast math lives in exactly one place (PHP).
     */
    public function palette(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'brand_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'accent_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'tint_depth' => ['nullable', Rule::in(['subtle', 'medium', 'bold'])],
        ]);

        return response()->json(BrandPalette::preview(
            $validated['brand_color'] ?? null,
            $validated['accent_color'] ?? null,
            $validated['tint_depth'] ?? 'subtle',
        ));
    }

    /**
     * Extract the full localized payload (scalars + lists), keyed by language.
     *
     * @return array<string, array<string, mixed>>
     */
    private function cleanedPayload(Request $request, ?string $section = null): array
    {
        $fields = [...self::LOCALIZED, ...self::LIST_FIELDS];

        if ($section !== null) {
            $fields = array_values(array_intersect($fields, self::SECTIONS[$section]));
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
     * Clean one language's fields: keep scalars as-is and drop empty list rows.
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function cleanFields(array $fields): array
    {
        foreach (self::LIST_FIELDS as $list) {
            if (array_key_exists($list, $fields)) {
                $fields[$list] = $this->cleanList($list, $fields[$list]);
            }
        }

        return array_filter(
            $fields,
            static fn ($value): bool => is_array($value) ? $value !== [] : filled($value),
        );
    }

    /**
     * Drop fully-empty stats/features rows so blank template rows never render.
     *
     * @return list<array<string, mixed>>|null
     */
    private function cleanList(string $field, mixed $rows): ?array
    {
        if (! is_array($rows)) {
            return null;
        }

        return collect($rows)
            ->filter(function (array $row) use ($field): bool {
                if ($field === 'home_stats') {
                    return filled($row['value'] ?? null) || filled($row['label'] ?? null);
                }

                return filled($row['title'] ?? null) || filled($row['description'] ?? null);
            })
            ->values()
            ->all();
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
                    [...self::LOCALIZED, ...self::LIST_FIELDS],
                ),
            ])
            ->all();
    }
}
