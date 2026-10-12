<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Language extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'dir',
        'is_active',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function programTranslations(): HasMany
    {
        return $this->hasMany(ProgramTranslation::class);
    }

    public function programTypeTranslations(): HasMany
    {
        return $this->hasMany(ProgramTypeTranslation::class);
    }

    /**
     * Languages that users are allowed to switch to, in display order.
     *
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('sort_order')->orderBy('name');
    }

    protected static function booted(): void
    {
        // Language settings change rarely, so invalidate the shared cache on any write.
        static::saved(fn () => self::flushCache());
        static::deleted(fn () => self::flushCache());
    }

    public static function flushCache(): void
    {
        Cache::forget('languages.active');
        Cache::forget('languages.default');
    }

    /**
     * The code that content falls back to when a translation is missing.
     */
    public static function defaultCode(): string
    {
        return Cache::rememberForever('languages.default', function (): string {
            $code = static::query()->where('is_default', true)->value('code');

            return (string) ($code ?? config('app.fallback_locale', 'en'));
        });
    }

    /**
     * Ordered list of language codes to try when resolving a translation.
     *
     * @return array<int, string>
     */
    public static function fallbackCodes(?string $preferred = null): array
    {
        $default = static::defaultCode();

        return array_values(array_unique(array_filter([
            $preferred,
            $default,
            config('app.fallback_locale'),
            'en',
        ])));
    }

    /**
     * Resolve the text direction for a language code, defaulting to left-to-right.
     */
    public static function dirFor(?string $code): string
    {
        if (! $code) {
            return 'ltr';
        }

        $dir = collect(static::activeList())->firstWhere('code', $code)['dir']
            ?? static::query()->where('code', $code)->value('dir');

        return $dir === 'rtl' ? 'rtl' : 'ltr';
    }

    /**
     * The highest-priority active language (top of the admin ordering). Falls
     * back to the default code when no active languages are configured.
     */
    public static function firstActiveCode(): string
    {
        $code = collect(static::activeList())->first()['code']
            ?? static::query()->active()->value('code');

        return (string) ($code ?? static::defaultCode());
    }

    /**
     * Lightweight representation of the active languages for shared state.
     *
     * @return array<int, array{code: string, name: string, dir: string}>
     */
    public static function activeList(): array
    {
        return Cache::rememberForever('languages.active', function (): array {
            return static::query()
                ->active()
                ->get(['code', 'name', 'dir'])
                ->map(fn (self $language): array => [
                    'code' => $language->code,
                    'name' => $language->name,
                    'dir' => $language->dir === 'rtl' ? 'rtl' : 'ltr',
                ])
                ->all();
        });
    }

    /**
     * Ensure only one language is flagged as the default fallback.
     */
    public function makeDefault(): void
    {
        if (! $this->is_default) {
            return;
        }

        static::query()
            ->whereKeyNot($this->getKey())
            ->where('is_default', true)
            ->update(['is_default' => false]);
    }
}
