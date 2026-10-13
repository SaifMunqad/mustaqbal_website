<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Single-row store for global, DB-driven site content (branding, home hero,
 * contact details and social links). Shared with the frontend on every request
 * so names, descriptions and images come from the database instead of being
 * hard-coded in the UI.
 */
class SiteSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand_name',
        'brand_short_name',
        'tagline',
        'logo_url',
        'favicon_url',
        'home_title',
        'home_subtitle',
        'home_cta_primary',
        'home_cta_secondary',
        'home_hero_image',
        'home_stats',
        'home_features',
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

    protected function casts(): array
    {
        return [
            'home_stats' => 'array',
            'home_features' => 'array',
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
            'brand_name' => 'Mustaqbal School',
            'brand_short_name' => 'Mustaqbal',
            'tagline' => 'Building tomorrow with quality education',
            'home_title' => 'Welcome to Mustaqbal School',
            'home_subtitle' => 'A modern Afghan school where students grow with confidence, knowledge, and character.',
            'home_cta_primary' => 'Explore Programs',
            'home_cta_secondary' => 'Contact Us',
            'home_stats' => [
                ['value' => '1,200+', 'label' => 'Students'],
                ['value' => '80+', 'label' => 'Teachers'],
                ['value' => '25+', 'label' => 'Years'],
                ['value' => '40+', 'label' => 'Subjects'],
            ],
            'home_features' => [
                ['icon' => 'faculty', 'title' => 'Qualified Faculty', 'description' => 'Experienced, dedicated teachers who put every student first.'],
                ['icon' => 'values', 'title' => 'Values-Based Learning', 'description' => 'Character, confidence and community woven into the curriculum.'],
                ['icon' => 'facilities', 'title' => 'Modern Facilities', 'description' => 'Bright classrooms, a library and spaces designed for focused learning.'],
                ['icon' => 'classes', 'title' => 'Small Classes', 'description' => 'Low student-to-teacher ratios so no one gets left behind.'],
            ],
            'contact_email' => 'info@mustaqbal.af',
            'contact_phone_primary' => '+93 700 000 001',
            'contact_phone_secondary' => '+93 799 000 001',
            'address' => 'Kart-e-Char, Kabul, Afghanistan',
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
        return [
            'brand_name' => $this->brand_name,
            'brand_short_name' => $this->brand_short_name,
            'tagline' => $this->tagline,
            'logo_url' => $this->logo_url,
            'favicon_url' => $this->favicon_url,
            'home' => [
                'title' => $this->home_title,
                'subtitle' => $this->home_subtitle,
                'cta_primary' => $this->home_cta_primary,
                'cta_secondary' => $this->home_cta_secondary,
                'hero_image' => $this->home_hero_image,
            ],
            'stats' => $this->home_stats ?? [],
            'features' => $this->home_features ?? [],
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
            'footer_text' => $this->footer_text,
        ];
    }
}
