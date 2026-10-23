<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A curated content reference for a {@see PageSection} (article/event/post/
 * program/job). Replaces the legacy `config.item_ids` JSON array with indexable,
 * cascade-safe rows that preserve the admin's explicit pick order.
 */
class SectionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_section_id',
        'item_type',
        'item_id',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'item_id' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<PageSection, self> */
    public function pageSection(): BelongsTo
    {
        return $this->belongsTo(PageSection::class);
    }
}
