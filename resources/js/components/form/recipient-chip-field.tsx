import { FieldWrapper } from '@/components/form/form-fields';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { ClipboardEvent, KeyboardEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type RecipientKind = 'email' | 'phone';

interface RecipientChipFieldProps {
    label: string;
    /**
     * Submitted as a newline-joined string, matching the backend list parser,
     * so manual entries and Excel imports end up in one field.
     */
    name: string;
    values: string[];
    onChange: (values: string[]) => void;
    /** Normalises one raw token; return null when it must be rejected. */
    normalize: (raw: string) => string | null;
    kind?: RecipientKind;
    placeholder?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    className?: string;
}

interface Notice {
    tone: 'error' | 'info';
    message: string;
}

/**
 * Chip-style list editor for campaign recipients.
 *
 * A single text field commits each entry on Enter, comma, semicolon, Tab (and
 * space for emails), so addresses can be typed, pasted from a spreadsheet, or
 * imported from Excel — everything is merged into the same deduplicated list.
 * Clicking a chip drops it back into the field for editing; the × removes it.
 */
export default function RecipientChipField({
    label,
    name,
    values,
    onChange,
    normalize,
    kind = 'email',
    placeholder,
    hint,
    error,
    required,
    className,
}: RecipientChipFieldProps) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState<Notice | null>(null);

    // Emails may be separated by any whitespace; phone numbers may contain
    // spaces themselves ("+93 700 123 456"), so only hard separators count.
    const separators = kind === 'email' ? /[\s,;]+/ : /[\r\n,;]+/;
    const bulkPaste = kind === 'email' ? /[\s,;]/ : /[\r\n,;]/;

    // Emails are compared case-insensitively; phone numbers are already
    // normalised by the caller.
    const keyOf = (value: string) =>
        kind === 'email' ? value.toLowerCase() : value;

    const commit = (raw: string) => {
        const tokens = raw
            .split(separators)
            .map((token) => token.trim())
            .filter((token) => token !== '');

        if (tokens.length === 0) {
            return;
        }

        const seen = new Set(values.map(keyOf));
        const next = [...values];
        let rejected: string | null = null;
        let duplicate: string | null = null;

        tokens.forEach((token) => {
            const normalized = normalize(token);

            if (normalized === null) {
                rejected = token;
                return;
            }

            const key = keyOf(normalized);

            if (seen.has(key)) {
                duplicate = normalized;
                return;
            }

            seen.add(key);
            next.push(normalized);
        });

        if (next.length !== values.length) {
            onChange(next);
        }

        if (rejected !== null) {
            // Keep the bad token in the field so it can be corrected.
            setQuery(rejected);
            setNotice({
                tone: 'error',
                message: t(
                    kind === 'email'
                        ? 'common.chipInput.invalidEmail'
                        : 'common.chipInput.invalidPhone',
                    { value: rejected },
                ),
            });
            return;
        }

        setQuery('');
        setNotice(
            duplicate === null
                ? null
                : {
                      tone: 'info',
                      message: t('common.chipInput.duplicate', {
                          value: duplicate,
                      }),
                  },
        );
    };

    const remove = (value: string) => {
        const key = keyOf(value);
        onChange(values.filter((entry) => keyOf(entry) !== key));
        setNotice(null);
    };

    const beginEdit = (value: string) => {
        remove(value);
        setQuery(value);

        requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(value.length, value.length);
        });
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        const commits =
            event.key === 'Enter' ||
            event.key === ',' ||
            event.key === ';' ||
            (kind === 'email' && event.key === ' ') ||
            (event.key === 'Tab' && query.trim() !== '');

        if (commits) {
            event.preventDefault();
            commit(query);
            return;
        }

        if (event.key === 'Backspace' && query === '' && values.length > 0) {
            event.preventDefault();
            remove(values[values.length - 1]);
        }
    };

    // A paste may hold one address or a whole column from a spreadsheet.
    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        const text = event.clipboardData.getData('text');

        if (bulkPaste.test(text)) {
            event.preventDefault();
            commit(query + (query === '' ? '' : '\n') + text);
        }
    };

    return (
        <FieldWrapper
            label={label}
            hint={hint}
            error={error}
            className={className}
        >
            <div
                className={cn(
                    'flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 text-sm shadow-xs transition-[color,box-shadow]',
                    'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                )}
            >
                {values.map((value) => (
                    <span
                        key={value}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted/70 py-0.5 ps-2 pe-1 text-xs"
                    >
                        <button
                            type="button"
                            onClick={() => beginEdit(value)}
                            title={t('common.chipInput.edit', { value })}
                            className="max-w-[18rem] truncate text-start hover:underline"
                        >
                            {value}
                        </button>
                        <button
                            type="button"
                            onClick={() => remove(value)}
                            aria-label={t('common.chipInput.remove', { value })}
                            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                ))}

                <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setNotice(null);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => commit(query)}
                    onPaste={handlePaste}
                    placeholder={
                        values.length > 0
                            ? t('common.chipInput.addMore')
                            : placeholder
                    }
                    className="min-w-[9rem] flex-1 bg-transparent py-1 outline-none placeholder:text-muted-foreground"
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                    {t('common.chipInput.count', { total: values.length })}
                </span>
                {values.length > 0 ? (
                    <button
                        type="button"
                        onClick={() => {
                            onChange([]);
                            setQuery('');
                            setNotice(null);
                        }}
                        className="text-destructive hover:underline"
                    >
                        {t('common.chipInput.clearAll')}
                    </button>
                ) : null}
            </div>

            {notice ? (
                <p
                    className={cn(
                        'text-xs',
                        notice.tone === 'error'
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                    )}
                >
                    {notice.message}
                </p>
            ) : null}

            <input
                type="hidden"
                name={name}
                value={values.join('\n')}
                required={required}
            />
        </FieldWrapper>
    );
}
