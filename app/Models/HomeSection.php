<?php

namespace App\Models;

use App\Enums\HomeSectionType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A single admin-curated block on the public home page.
 *
 * `config` is a per-section-type bag:
 *  - curated sections (articles/events/recognition): { item_ids: int[] } plus the
 *    column `limit` for how many to show when no explicit picks are made.
 *  - authored sections (banner/announcement): { heading, body, image_url,
 *    cta_label, cta_url, tone }.
 *
 * Curated sections reference content by id and are resolved to live records at
 * read time (see App\Support\Home\HomeSections), so the home page never shows
 * stale copies of edited/unpublished/deleted source content.
 */
class HomeSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'section_type',
        'title',
        'config',
        'limit',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'section_type' => HomeSectionType::class,
            'config' => 'array',
            'limit' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Active sections in display order.
     */
    public function scopeActiveOrdered(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /**
     * All sections in display order (used by the admin portal).
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The next sort position, appended to the end of the current layout.
     */
    public static function nextSortOrder(): int
    {
        return ((int) static::query()->max('sort_order')) + 1;
    }

    /**
     * The explicit item ids chosen for a curated section, if any.
     *
     * @return list<int>
     */
    public function itemIds(): array
    {
        $ids = $this->config['item_ids'] ?? [];

        return array_values(array_filter(array_map('intval', (array) $ids)));
    }
}
