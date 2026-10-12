<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'writer_name',
        'language',
        'title',
        'slug',
        'excerpt',
        'body',
        'cover_image',
        'images',
        'published_at',
        'is_published',
    ];

    /**
     * Computed attributes appended to every serialized article so the frontend
     * can render the content in the article's own text direction.
     *
     * @var array<int, string>
     */
    protected $appends = ['language_dir'];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_published' => 'boolean',
            'images' => 'array',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The writing direction for the article's chosen language. Falls back to the
     * site default language when none is set, so older articles still render in
     * a sensible direction. Independent of the reader's current UI language.
     */
    public function getLanguageDirAttribute(): string
    {
        return Language::dirFor($this->language ?: Language::defaultCode());
    }
}

