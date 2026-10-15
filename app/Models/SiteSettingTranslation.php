<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteSettingTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_setting_id',
        'language_id',
        'brand_name',
        'brand_short_name',
        'tagline',
        'home_title',
        'home_subtitle',
        'home_cta_primary',
        'home_cta_secondary',
        'footer_text',
        'home_stats',
        'home_features',
    ];

    protected function casts(): array
    {
        return [
            'home_stats' => 'array',
            'home_features' => 'array',
        ];
    }

    public function siteSetting(): BelongsTo
    {
        return $this->belongsTo(SiteSetting::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
