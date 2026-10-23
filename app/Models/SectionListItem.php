<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row of an ordered, localized collection on a {@see PageSection} (features,
 * stats, faqs, ...). `item_group` categorizes multiple lists on one block and a
 * null `language_id` marks a shared, non-localized row. Generic typed columns are
 * reused across every list shape.
 */
class SectionListItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_section_id',
        'language_id',
        'item_group',
        'sort_order',
        'value',
        'title',
        'description',
        'icon',
        'image_path',
        'url',
    ];

    protected function casts(): array
    {
        return [
            'language_id' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<PageSection, self> */
    public function pageSection(): BelongsTo
    {
        return $this->belongsTo(PageSection::class);
    }

    /** @return BelongsTo<Language, self> */
    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
