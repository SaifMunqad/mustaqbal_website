<?php

namespace App\Models;

use App\Support\Translation\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SitePage extends Model
{
    use HasFactory;
    use HasTranslations;

    /**
     * `title` and the rich-text `body` are localized (see `site_page_translations`).
     * `content` is a computed merge: the shared, non-localized JSON kept on the
     * parent (video embed + legacy structured sections) plus the reader's-language
     * body, so the public views keep reading `page.content.body` unchanged.
     *
     * @var array<int, string>
     */
    protected $appends = ['title'];

    protected $fillable = [
        'slug',
        'hero_image',
        'content',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    /**
     * @return list<string>
     */
    public function translatedAttributes(): array
    {
        return ['title', 'body'];
    }

    public function getTitleAttribute(): ?string
    {
        return $this->translated('title');
    }

    /**
     * The shared (non-localized) content payload stored on the parent column.
     *
     * @return array<string, mixed>
     */
    public function sharedContent(): array
    {
        $raw = $this->attributes['content'] ?? null;

        if (is_array($raw)) {
            return $raw;
        }

        return json_decode((string) $raw, true) ?: [];
    }

    /**
     * Content merged with the localized body for the active locale.
     *
     * @return array<string, mixed>
     */
    public function getContentAttribute(): array
    {
        $shared = $this->sharedContent();
        $body = $this->translated('body');

        return array_merge($shared, [
            'body' => $body ?? ($shared['body'] ?? ''),
        ]);
    }

    public function setContentAttribute(mixed $value): void
    {
        $this->attributes['content'] = is_string($value)
            ? $value
            : json_encode($value ?? []);
    }
}
