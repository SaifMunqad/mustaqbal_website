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

    /**
     * Localized structured content sections stored per language in the
     * translation row's `content` JSON (the About page's editable blocks).
     *
     * @var list<string>
     */
    public const SECTION_KEYS = [
        'intro',
        'mission',
        'vision',
        'stats',
        'values',
        'highlights',
        'goals',
        'main_points',
        'message',
        'faq',
    ];

    /**
     * Shared, non-localized content keys kept on the parent column.
     *
     * @var list<string>
     */
    public const SHARED_KEYS = ['video_embed'];

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
     * The structured sections for the reader's language, read from the active
     * translation row's `content` JSON. Fallback-free at the row level: when no
     * matching translation row exists this is empty, so the shared parent value
     * (and then the built-in defaults in the view) win.
     *
     * @return array<string, mixed>
     */
    public function localizedContent(?string $languageCode = null): array
    {
        $row = $this->resolveTranslationRow($languageCode);
        $content = $row?->content;

        return is_array($content) ? $content : [];
    }

    /**
     * Content merged for the active locale: shared parent keys, overlaid with the
     * language's localized sections, plus the localized rich-text body.
     *
     * @return array<string, mixed>
     */
    public function getContentAttribute(): array
    {
        $shared = $this->sharedContent();
        $localized = $this->localizedContent();
        $body = $this->translated('body');

        return array_merge($shared, $localized, [
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
