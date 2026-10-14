<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'language_id',
        'name',
        'description',
        'schedule',
        'age_recommendation',
        'classroom_number',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}

