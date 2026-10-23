<?php

namespace App\Models;

use App\Enums\SectionType;
use App\Support\Translation\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A single block on a builder page.
 *
 * Storage is deliberately categorized (see the migration): shared presentation
 * lives in typed columns, localized text in {@see PageSectionTranslation} rows,
 * curated content references in {@see SectionItem} rows, and ordered localized
 * collections in {@see SectionListItem} rows. The `config` JSON bag is only a
 * narrow per-type escape hatch for the occasional boolean/enum setting.
 *
 * Responsive placement is data-driven via `span_lg/md/sm` (1-12 of a 12-column
 * grid); when a span column is null the block falls back to its
 * {@see SectionType} default at render time, so a block stays self-adaptive.
 */
class PageSection extends Model
{
    use HasFactory;
    use HasTranslations;

    protected $fillable = [
        'page_id',
        'section_type',
        'zone',
        'sort_order',
        'is_active',
        'image_path',
        'cta_url',
        'tone',
        'columns',
        'limit',
        'span_lg',
        'span_md',
        'span_sm',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'section_type' => SectionType::class,
            'is_active' => 'boolean',
            'columns' => 'integer',
            'limit' => 'integer',
            'sort_order' => 'integer',
            'span_lg' => 'integer',
            'span_md' => 'integer',
            'span_sm' => 'integer',
            'config' => 'array',
        ];
    }

    /**
     * Localized scalar text for this block.
     *
     * @return list<string>
     */
    public function translatedAttributes(): array
    {
        return ['title', 'heading', 'body', 'cta_label'];
    }

    /** @return BelongsTo<Page, self> */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    /** @return HasMany<SectionItem> */
    public function items(): HasMany
    {
        return $this->hasMany(SectionItem::class)->orderBy('sort_order')->orderBy('id');
    }

    /** @return HasMany<SectionListItem> */
    public function listItems(): HasMany
    {
        return $this->hasMany(SectionListItem::class)->orderBy('sort_order')->orderBy('id');
    }

    /** Active sections in display order. */
    public function scopeActiveOrdered(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('sort_order')->orderBy('id');
    }

    /** All sections in display order (admin portal). */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The next sort position on a page, appended to the end of its layout.
     */
    public static function nextSortOrder(int $pageId): int
    {
        return ((int) static::query()->where('page_id', $pageId)->max('sort_order')) + 1;
    }

    /**
     * The explicit item ids chosen for a curated block, ordered.
     *
     * @return list<int>
     */
    public function itemIds(): array
    {
        $relation = $this->relationLoaded('items')
            ? $this->items
            : $this->items()->get();

        return $relation->pluck('item_id')->map(fn ($id): int => (int) $id)->values()->all();
    }
}
