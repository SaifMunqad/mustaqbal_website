<?php

namespace App\Support\Translation;

use App\Models\Language;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Shared behaviour for models whose user-facing text lives in a dedicated
 * `<model>_translations` table keyed by (parent id + language id), following the
 * original `programs` / `program_translations` pattern.
 *
 * A consuming model must:
 *  - name its translation model `<Model>Translation` (resolved automatically),
 *  - implement {@see translatedAttributes()} listing the localized columns.
 *
 * The parent table keeps non-translatable data (FKs, slugs, images, dates,
 * status/visibility flags, settings). Language-agnostic identifiers such as the
 * canonical `slug` stay on the parent and act as the stable fallback.
 */
trait HasTranslations
{
    /**
     * The class name of the model's translation records. Derived from the
     * parent class by convention (`App\Models\Post` -> `App\Models\PostTranslation`).
     *
     * @return class-string<Model>
     */
    public static function translationClass(): string
    {
        return static::class . 'Translation';
    }

    /**
     * The localized attributes stored on the translation rows. Consuming models
     * must override this to declare their translatable columns.
     *
     * @return list<string>
     */
    abstract public function translatedAttributes(): array;

    public function translations(): HasMany
    {
        return $this->hasMany(static::translationClass());
    }

    /**
     * The translation row matching the requested (or current) locale, walking the
     * shared fallback chain. Falls back to the first available row so a record is
     * never rendered without content when any translation exists.
     */
    public function resolveTranslationRow(?string $languageCode = null): ?Model
    {
        /** @var \Illuminate\Support\Collection<int, Model> $translations */
        $translations = $this->relationLoaded('translations')
            ? $this->translations
            : $this->translations()->with('language')->get();

        foreach (Language::fallbackCodes($languageCode ?? app()->getLocale()) as $code) {
            $match = $translations->firstWhere('language.code', $code);

            if ($match) {
                return $match;
            }
        }

        return $translations->first();
    }

    /**
     * Resolve a single localized field, gracefully falling back to a same-named
     * parent column (when it still exists) and finally to the supplied default.
     */
    public function translated(string $field, ?string $languageCode = null, mixed $default = null): mixed
    {
        $row = $this->resolveTranslationRow($languageCode);

        if ($row && filled($row->{$field} ?? null)) {
            return $row->{$field};
        }

        // The parent may retain a column with the same name during a staged
        // migration; prefer it before the caller-supplied default.
        if (array_key_exists($field, $this->getAttributes())) {
            $parentValue = $this->{$field};

            if (filled($parentValue)) {
                return $parentValue;
            }
        }

        return $default;
    }

    /**
     * Persist/refresh the default-language row from the given attributes. When no
     * attributes are passed, the model's own same-named columns are used — this
     * keeps the original `syncDefaultTranslation()` behaviour for the parent-held
     * source-of-truth (e.g. `programs` still storing name/description inline).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function syncDefaultTranslation(array $attributes = [], ?string $languageCode = null): void
    {
        $language = Language::query()->where('code', $languageCode ?? Language::defaultCode())->first();

        if (! $language) {
            return;
        }

        if ($attributes === []) {
            $attributes = collect($this->translatedAttributes())
                ->mapWithKeys(fn (string $field): array => [$field => $this->{$field}])
                ->all();
        }

        $this->translations()->updateOrCreate(
            ['language_id' => $language->id],
            $attributes,
        );
    }
}
