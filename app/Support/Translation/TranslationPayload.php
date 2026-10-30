<?php

namespace App\Support\Translation;

use App\Models\Language;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;

/**
 * Normalizes the per-language content payload submitted by the shared admin
 * editor (`translations.{code}.{field}`) into translation-row writes and, for
 * the parent's default language, into plain attribute arrays.
 *
 * The default language is the source of truth: it is validated as required and
 * mirrored onto the parent's own translatable columns (when those still exist),
 * while every other submitted language is persisted as a translation row.
 */
class TranslationPayload
{
    /**
     * Validation rules for the translatable fields across every active language.
     * Fields listed in `$requiredForDefault` are required for the default
     * language; all other fields/languages are optional but typed. Pass `null`
     * to require every field for the default language.
     *
     * @param  list<string>  $fields
     * @param  array<string, mixed>  $rules  base per-field rules (e.g. ['title' => ['max:255']])
     * @param  list<string>|null  $requiredForDefault
     * @return array<string, mixed>
     */
    public static function rules(array $fields, array $rules = [], ?array $requiredForDefault = null): array
    {
        $default = Language::defaultCode();
        $codes = collect(Language::activeList())->pluck('code')->all();
        $requiredDefault ??= $fields;

        $out = [];

        foreach ($codes as $code) {
            foreach ($fields as $field) {
                $fieldRules = $rules[$field] ?? ['string'];
                $isRequired = $code === $default && in_array($field, $requiredDefault, true);

                $out["translations.$code.$field"] = array_merge(
                    $fieldRules,
                    [$isRequired ? 'required' : 'nullable'],
                );
            }
        }

        // `translations` must be an array of per-language arrays. Only the active
        // language codes are enumerated as field rules above, and `extract()`
        // drops any other code, so unknown keys are simply ignored here. Each
        // value must itself be an array (never validate the array against `in`,
        // which would wrongly reject every language with "selected ... is invalid").
        $out['translations'] = ['array'];
        $out['translations.*'] = ['array'];

        return $out;
    }

    /**
     * Extract the submitted translations for the given fields, keyed by language
     * code. Unknown codes and unlisted fields are dropped.
     *
     * @param  list<string>  $fields
     * @return array<string, array<string, mixed>>
     */
    public static function extract(Request $request, array $fields): array
    {
        $raw = $request->input('translations', []);

        if (! is_array($raw)) {
            return [];
        }

        $allowed = collect(Language::activeList())->pluck('code')->all();
        $payload = [];

        foreach ($raw as $code => $values) {
            if (! is_array($values) || ! in_array((string) $code, $allowed, true)) {
                continue;
            }

            foreach ($fields as $field) {
                if (! array_key_exists($field, $values)) {
                    continue;
                }

                $value = $values[$field];

                // Keep non-empty strings; empty optional translations are skipped
                // so they fall back to the default language at read time.
                if (is_string($value)) {
                    if (trim($value) !== '') {
                        $payload[$code][$field] = $value;
                    }

                    continue;
                }

                // Non-scalar values (e.g. JSON block arrays) are stored verbatim.
                $payload[$code][$field] = $value;
            }
        }

        return $payload;
    }

    /**
     * Persist an extracted payload onto a model's translations relation, one
     * `updateOrCreate` per language. Existing rows for languages not present in
     * the payload are left untouched.
     *
     * @param  array<string, array<string, mixed>>  $payload
     */
    public static function apply(HasMany $relation, array $payload): void
    {
        if ($payload === []) {
            return;
        }

        $languages = Language::query()
            ->whereIn('code', array_keys($payload))
            ->get()
            ->keyBy('code');

        foreach ($payload as $code => $fields) {
            $language = $languages->get($code);

            if (! $language) {
                continue;
            }

            $relation->updateOrCreate(
                ['language_id' => $language->id],
                $fields,
            );
        }
    }

    /**
     * The flat attribute set for the parent row's default-language values, taken
     * from the payload (or empty when the default language was not submitted).
     *
     * @param  array<string, array<string, mixed>>  $payload
     * @return array<string, mixed>
     */
    public static function defaultAttributes(array $payload): array
    {
        return $payload[Language::defaultCode()] ?? [];
    }
}
