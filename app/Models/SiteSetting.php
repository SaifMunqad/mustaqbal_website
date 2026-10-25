<?php

namespace App\Models;

use App\Support\Theme\BrandPalette;
use App\Support\Translation\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * Single-row store for global, DB-driven site content (branding, contact details
 * and social links). Shared with the frontend on every request so names,
 * descriptions and images come from the database instead of being hard-coded in
 * the UI.
 *
 * The brand name/short name, tagline and footer text are localized via
 * `site_setting_translations` (see {@see HasTranslations}); the parent row keeps
 * the default-language values as the fallback source of truth. Page layouts —
 * including the home hero, stats and feature rails — are not stored here: they
 * are page-builder blocks.
 */
class SiteSetting extends Model
{
    use HasFactory;
    use HasTranslations;

    protected $fillable = [
        'brand_name',
        'brand_short_name',
        'tagline',
        'logo_url',
        'brand_color',
        'accent_color',
        'tint_depth',
        'reverse_logo_url',
        'contact_email',
        'contact_phone_primary',
        'contact_phone_secondary',
        'address',
        'map_latitude',
        'map_longitude',
        'map_zoom',
        'map_embed_url',
        'social_facebook',
        'social_instagram',
        'social_twitter',
        'social_youtube',
        'social_whatsapp',
        'footer_text',
    ];

    /**
     * @return list<string>
     */
    public function translatedAttributes(): array
    {
        return [
            'brand_name',
            'brand_short_name',
            'tagline',
            'footer_text',
        ];
    }

    /**
     * Baseline values that mirror the previously hard-coded UI strings, so
     * introducing the database-driven layer changes nothing visually.
     *
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'brand_name' => 'My School',
            'brand_short_name' => 'My School',
            'tagline' => 'Building tomorrow with quality education',
            'contact_email' => 'info@myschool.example',
            'contact_phone_primary' => '+93 700 000 001',
            'contact_phone_secondary' => '+93 799 000 001',
            'address' => 'Kart-e-Char, Kabul, Afghanistan',
            'tint_depth' => 'subtle',
            'map_zoom' => '15',
            'map_embed_url' => 'https://maps.google.com/maps?q=Kabul%20Afghanistan&t=&z=13&ie=UTF8&iwloc=&output=embed',
            'footer_text' => 'All rights reserved.',
        ];
    }

    /**
     * The persisted settings row, or an unsaved instance filled with defaults
     * when nothing has been stored yet. Never writes on read.
     */
    public static function current(): static
    {
        return static::query()->first() ?? new static(static::defaults());
    }

    /**
     * The persisted row, creating it on demand (used by the update flow).
     */
    public static function resolved(): static
    {
        return static::query()->first() ?? static::query()->create(static::defaults());
    }

    /**
     * Shape exposed to the frontend through the Inertia share layer.
     *
     * @return array<string, mixed>
     */
    public function toShared(): array
    {
        $icons = $this->iconAssets();

        return [
            'brand_name' => $this->translated('brand_name'),
            'brand_short_name' => $this->translated('brand_short_name'),
            'tagline' => $this->translated('tagline'),
            'logo_url' => $this->logo_url,
            'favicon_url' => $icons['ico'] ?? $icons['favicon_32'] ?? null,
            // Branding palette: the admin picks one color (plus an optional
            // accent) and the derived tokens drive every public surface.
            'theme' => [
                'brand_color' => $this->brand_color,
                'accent_color' => $this->accent_color,
                'tint_depth' => $this->tint_depth ?? 'subtle',
                'reverse_logo_url' => $this->reverse_logo_url,
                'palette' => $this->palette(),
            ],
            'contact' => [
                'email' => $this->contact_email,
                'phone_primary' => $this->contact_phone_primary,
                'phone_secondary' => $this->contact_phone_secondary,
                'address' => $this->address,
                'map_latitude' => $this->map_latitude !== null ? (float) $this->map_latitude : null,
                'map_longitude' => $this->map_longitude !== null ? (float) $this->map_longitude : null,
                'map_zoom' => $this->map_zoom !== null ? (int) $this->map_zoom : null,
                'map_embed_url' => $this->map_embed_url,
            ],
            'social' => [
                'facebook' => $this->social_facebook,
                'instagram' => $this->social_instagram,
                'twitter' => $this->social_twitter,
                'youtube' => $this->social_youtube,
                'whatsapp' => $this->social_whatsapp,
            ],
            'footer_text' => $this->translated('footer_text'),
        ];
    }

    /**
     * The derived branding palette for this row: light and dark CSS custom
     * property maps plus the measured contrast ratios.
     *
     * @return array{light: array<string, string>, dark: array<string, string>, contrast: array<string, float>}
     */
    public function palette(): array
    {
        return BrandPalette::make($this->brand_color, $this->accent_color, $this->tint_depth ?? 'subtle');
    }

    /**
     * Publicly reachable URLs for the icon assets generated from the logo (see
     * {@see \App\Services\FaviconService}). Only existing files are returned, each
     * with a content-versioned query string so the browser tab icon refreshes the
     * moment the logo changes. Keys: favicon_16/32/48/192, apple_touch, ico.
     *
     * @return array<string, string>
     */
    public function iconAssets(): array
    {
        $disk = Storage::disk('public');

        $files = [
            'favicon_16' => 'branding/favicon-16.png',
            'favicon_32' => 'branding/favicon-32.png',
            'favicon_48' => 'branding/favicon-48.png',
            'favicon_192' => 'branding/favicon-192.png',
            'apple_touch' => 'branding/apple-touch-icon.png',
            'ico' => 'branding/favicon.ico',
        ];

        $urls = [];
        foreach ($files as $key => $path) {
            if ($disk->exists($path)) {
                $urls[$key] = '/storage/'.$path.'?v='.$disk->lastModified($path);
            }
        }

        return $urls;
    }
}
