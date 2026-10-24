<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * An admin-uploaded font family. Its weights live in `font_files`, one row per
 * `@font-face` rule, and a language points at the family through
 * `languages.font_family_id`.
 */
class Font extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'created_by',
    ];

    public function files(): HasMany
    {
        return $this->hasMany(FontFile::class);
    }

    /**
     * Languages currently using this family. Deleting a family is refused while
     * this is non-empty, so no language silently loses its typeface.
     */
    public function languages(): HasMany
    {
        return $this->hasMany(Language::class, 'font_family_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The family name as it is written inside CSS. Admins may type anything, so
     * everything CSS would read as syntax is stripped before the name is
     * quoted into `font-family` / `@font-face`.
     */
    public function cssFamily(): string
    {
        $clean = trim((string) preg_replace('/[^A-Za-z0-9 _\-]/u', '', $this->name));

        return $clean !== '' ? $clean : 'Custom Font '.$this->id;
    }

    /**
     * Full `font-family` stack: the uploaded family first, then the built-in
     * fallbacks, so a glyph the upload lacks (a Latin-only font chosen for Dari,
     * for example) still renders from Noto Naskh instead of showing tofu.
     */
    public function fontStack(): string
    {
        return "'{$this->cssFamily()}', 'Noto Naskh Arabic', 'Carlito', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";
    }

    /**
     * The `@font-face` payload for this family, ordered lightest first.
     *
     * @return list<array{weight: int, style: string, url: string, format: string}>
     */
    public function faces(): array
    {
        return $this->files
            ->sortBy('weight')
            ->map(fn (FontFile $file): array => [
                'weight' => (int) $file->weight,
                'style' => $file->style,
                'url' => self::publicUrl($file),
                'format' => $file->format,
            ])
            ->values()
            ->all();
    }

    /**
     * App-relative URL with a version stamp, so replacing a file cannot serve a
     * stale glyph set from the browser cache.
     */
    public static function publicUrl(FontFile $file): string
    {
        $absolute = Storage::disk('public')->url($file->path);
        $path = '/'.ltrim((string) parse_url($absolute, PHP_URL_PATH), '/');

        return $path.'?v='.($file->updated_at?->timestamp ?? 0);
    }

    public function directory(): string
    {
        return 'fonts/'.$this->slug;
    }

    public function deleteFiles(): void
    {
        Storage::disk('public')->deleteDirectory($this->directory());
    }

    protected static function booted(): void
    {
        // The language typography cache embeds family names and file URLs.
        static::saved(fn () => Language::flushCache());
        static::deleted(fn () => Language::flushCache());
    }
}
