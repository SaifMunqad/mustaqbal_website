<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A builder page — a named, ordered layout of {@see PageSection} blocks. The
 * stable `key` ('home', 'about', ...) is what callers resolve, so layouts are
 * addressed programmatically rather than by id.
 */
class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'label',
        'is_active',
        'default_zone',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<PageSection> */
    public function sections(): HasMany
    {
        return $this->hasMany(PageSection::class)->orderBy('sort_order')->orderBy('id');
    }

    public function scopeKey(Builder $query, string $key): Builder
    {
        return $query->where('key', $key);
    }

    /**
     * Resolve a page by its stable key, creating it on first use so a page can be
     * opened in the editor before any content exists.
     */
    public static function resolve(string $key, ?string $label = null): self
    {
        return static::query()->firstOrCreate(['key' => $key], [
            'label' => $label ?? ucfirst($key),
            'is_active' => true,
            'default_zone' => 'main',
        ]);
    }
}
