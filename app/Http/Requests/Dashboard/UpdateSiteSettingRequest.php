<?php

namespace App\Http\Requests\Dashboard;

use App\Models\Language;
use App\Support\Rules\ImageLocation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSiteSettingRequest extends FormRequest
{
    /**
     * Localized scalar fields edited per language.
     *
     * @var list<string>
     */
    public const LOCALIZED = [
        'brand_name',
        'brand_short_name',
        'tagline',
        'footer_text',
    ];

    /**
     * Localized fields that must be filled for the default language, since the
     * parent mirrors them as the non-null source of truth (branding columns).
     *
     * @var list<string>
     */
    public const REQUIRED_FOR_DEFAULT = ['brand_name', 'brand_short_name'];

    /**
     * Editable sections of the settings page. Each entry lists the fields saved
     * (and validated) together, so the dashboard can persist one section without
     * resubmitting every other field on the page.
     *
     * @var array<string, list<string>>
     */
    public const SECTIONS = [
        'identity' => [
            'logo_url', 'reverse_logo_url',
            'brand_name', 'brand_short_name', 'tagline', 'footer_text',
        ],
        'appearance' => ['brand_color', 'accent_color', 'tint_depth'],
        'contact' => [
            'contact_email', 'contact_phone_primary', 'contact_phone_secondary',
            'address', 'map_latitude', 'map_longitude', 'map_zoom', 'map_embed_url',
        ],
        'social' => [
            'social_facebook', 'social_instagram', 'social_twitter',
            'social_youtube', 'social_whatsapp',
        ],
    ];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * The section this request saves. A missing or unknown name means "the whole
     * form", which keeps single-payload clients (and older callers) working.
     */
    public function section(): ?string
    {
        $section = $this->input('section');

        return is_string($section) && isset(self::SECTIONS[$section]) ? $section : null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $codes = collect(Language::activeList())->pluck('code')->all();
        $default = Language::defaultCode();

        $scalarRules = [
            'brand_name' => ['string', 'max:255'],
            'brand_short_name' => ['string', 'max:100'],
            'tagline' => ['string', 'max:255'],
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

        $section = $this->section();

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
        $localized = array_intersect($fields, self::LOCALIZED);

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
}
