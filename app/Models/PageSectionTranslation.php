<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One language's localized scalar text for a {@see PageSection}.
 */
class PageSectionTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_section_id',
        'language_id',
        'title',
        'heading',
        'body',
        'cta_label',
    ];

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
