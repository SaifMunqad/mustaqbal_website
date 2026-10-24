<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One weight/style file of an uploaded font family.
 */
class FontFile extends Model
{
    protected $fillable = [
        'font_id',
        'weight',
        'style',
        'path',
        'format',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'integer',
        ];
    }

    public function font(): BelongsTo
    {
        return $this->belongsTo(Font::class);
    }
}
