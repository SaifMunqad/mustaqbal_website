<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Language;
use App\Models\SiteSetting;
use App\Services\FaviconService;
use App\Support\Rules\ImageLocation;
use App\Support\Translation\TranslationPayload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class DashboardSiteSettingController extends Controller
{
    public function __construct(private readonly FaviconService $favicons)
    {
    }

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

    public function edit(): Response
    {
        $setting = SiteSetting::current();
        $setting->load('translations.language');

        return Inertia::render('dashboard/site-settings/edit', [
            'settings' => $setting,
            'translations' => $this->existingTranslations($setting),
            'mapsKey' => config('services.google.maps_key'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $setting = SiteSetting::resolved();
        $previousLogo = $setting->logo_url;

        // Non-localized columns live on the parent row only.
        $setting->update(Arr::except($validated, ['translations']));

        // The logo is the single source of truth for every system icon: rebuild
        // the favicon set whenever it changes (or the assets are missing), and
        // clear them entirely when the logo is removed so the fallback returns.
        $newLogo = $setting->logo_url;
        if (filled($newLogo)) {
            if ($newLogo !== $previousLogo || ! $this->favicons->exists()) {
                $this->favicons->regenerate($newLogo);
            }
        } elseif (filled($previousLogo)) {
            $this->favicons->clear();
        }

        // Full per-language payload: localized scalars + the JSON lists.
        $payload = $this->cleanedPayload($request);
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
            ->with('success', 'Site settings updated successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
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

        return array_merge([
            // Brand assets (shared across languages). The favicon is derived
            // automatically from the logo (see FaviconService) and no longer
            // uploaded separately.
            'logo_url' => ['nullable', new ImageLocation, 'max:2048'],
            'home_hero_image' => ['nullable', new ImageLocation, 'max:2048'],

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
    }

    /**
     * Extract the full localized payload (scalars + lists), keyed by language.
     *
     * @return array<string, array<string, mixed>>
     */
    private function cleanedPayload(Request $request): array
    {
        return TranslationPayload::extract($request, [...self::LOCALIZED, ...self::LIST_FIELDS]);
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
