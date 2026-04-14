<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramTypeTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_type',
        'language_id',
        'label',
    ];

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}

