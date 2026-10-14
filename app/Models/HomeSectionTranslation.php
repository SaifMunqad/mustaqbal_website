<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeSectionTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'home_section_id',
        'language_id',
        'title',
        'heading',
        'body',
        'cta_label',
    ];

    public function homeSection(): BelongsTo
    {
        return $this->belongsTo(HomeSection::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
