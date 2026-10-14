<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookCategoryTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_category_id',
        'language_id',
        'name',
    ];

    public function bookCategory(): BelongsTo
    {
        return $this->belongsTo(BookCategory::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
