import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import RichTextEditor from '@/components/editor/rich-text-editor';
import { TextAreaField, TextField } from '@/components/form/form-fields';
import { cn } from '@/lib/utils';
import type { LanguageOption, SharedData } from '@/types';

/**
 * A single localized input rendered identically for every language tab.
 * - `text` / `textarea` map to the shared form fields.
 * - `richtext` renders the tiptap editor (posts its HTML to the form).
 */
export interface TranslatableField {
    /** Field key persisted on the translation row (e.g. `title`, `body`). */
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'richtext';
    required?: boolean;
    placeholder?: string;
    hint?: string;
    rows?: number;
    maxLength?: number;
}

/** Existing translations keyed by `language code -> field -> value`, for edit seeding. */
export type TranslationValues = Record<string, Record<string, string>>;

interface LanguageTabsEditorProps {
    fields: TranslatableField[];
    /** Seed values for edit; a missing entry renders an empty field. */
    translations?: TranslationValues;
    /** Called on every keystroke with the full current payload (for controlled parents). */
    onChange?: (values: TranslationValues) => void;
    className?: string;
}

/**
 * Tabbed per-language editor for translatable content. Every language's inputs
 * stay mounted (only visually hidden) so a single form submit carries the whole
 * `translations.{code}.{field}` payload; the default language is marked required
 * and acts as the fallback at read time.
 */
export default function LanguageTabsEditor({
    fields,
    translations = {},
    onChange,
    className,
}: LanguageTabsEditorProps) {
    const { languages } = usePage<SharedData>().props;

    const available: LanguageOption[] = useMemo(
        () => languages?.available ?? [],
        [languages],
    );
    const defaultCode = languages?.default ?? 'en';

    const [active, setActive] = useState<string>(
        available.find((entry) => entry.code === defaultCode)?.code
            ?? available[0]?.code
            ?? defaultCode,
    );

    const [values, setValues] = useState<TranslationValues>(() =>
        seedValues(available, fields, translations),
    );

    const setValue = (code: string, field: string, value: string) => {
        setValues((previous) => {
            const next: TranslationValues = {
                ...previous,
                [code]: { ...(previous[code] ?? {}), [field]: value },
            };
            onChange?.(next);

            return next;
        });
    };

    const isDefault = (code: string) => code === defaultCode;

    if (available.length === 0) {
        return null;
    }

    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex flex-wrap gap-1 border-b border-border">
                {available.map((language) => (
                    <button
                        key={language.code}
                        type="button"
                        onClick={() => setActive(language.code)}
                        className={cn(
                            'relative rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
                            active === language.code
                                ? 'border-b-2 border-primary text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {language.name}
                        {isDefault(language.code) ? (
                            <span className="ms-1 text-xs text-muted-foreground">
                                *
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {available.map((language) => {
                const hidden = active !== language.code;

                return (
                    <div
                        key={language.code}
                        className={cn('space-y-4', hidden && 'hidden')}
                        hidden={hidden}
                        dir={language.dir}
                    >
                        {fields.map((field) => {
                            const name = `translations.${language.code}.${field.name}`;
                            const value = values[language.code]?.[field.name] ?? '';
                            const required = isDefault(language.code) && field.required !== false;

                            if (field.type === 'richtext') {
                                return (
                                    <RichTextEditor
                                        key={field.name}
                                        name={name}
                                        value={value}
                                        onChange={(html) => setValue(language.code, field.name, html)}
                                        dir={language.dir}
                                        placeholder={field.placeholder}
                                    />
                                );
                            }

                            if (field.type === 'textarea') {
                                return (
                                    <TextAreaField
                                        key={field.name}
                                        label={field.label}
                                        name={name}
                                        rows={field.rows ?? 4}
                                        required={required}
                                        maxLength={field.maxLength}
                                        placeholder={field.placeholder}
                                        hint={field.hint}
                                        value={value}
                                        onChange={(event) =>
                                            setValue(language.code, field.name, event.target.value)
                                        }
                                    />
                                );
                            }

                            return (
                                <TextField
                                    key={field.name}
                                    label={field.label}
                                    name={name}
                                    required={required}
                                    maxLength={field.maxLength}
                                    placeholder={field.placeholder}
                                    hint={field.hint}
                                    value={value}
                                    onChange={(event) =>
                                        setValue(language.code, field.name, event.target.value)
                                    }
                                />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Build the initial `{code: {field: value}}` map from existing translations,
 * falling back to the parent-provided seed (the default-language source).
 */
function seedValues(
    available: LanguageOption[],
    fields: TranslatableField[],
    translations: TranslationValues,
): TranslationValues {
    const seeded: TranslationValues = {};

    for (const language of available) {
        seeded[language.code] = {};

        for (const field of fields) {
            seeded[language.code][field.name] =
                translations[language.code]?.[field.name] ?? '';
        }
    }

    return seeded;
}
