/**
 * Searchable single select for long option lists.
 *
 * A native <select> becomes unusable once a catalog has dozens of entries, so
 * this control pairs a trigger button with a searchable panel. The chosen value
 * is submitted through a hidden input, which lets it drop into an Inertia
 * <Form> exactly like the fields in form-fields.tsx.
 *
 * The panel is fully keyboard operable (arrows to move, Enter to pick, Escape to
 * close), closes on an outside click, and is laid out with logical properties so
 * it mirrors correctly under RTL.
 */
import { FieldWrapper } from '@/components/form/form-fields';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Search } from 'lucide-react';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

export interface SearchableSelectOption {
    value: string;
    label: string;
    /** Secondary line under the label, e.g. the native spelling. */
    description?: string;
    /** Short monospace badge on the row end, e.g. the language code. */
    badge?: string;
    /** Extra search tokens matched in addition to the visible text. */
    keywords?: string[];
}

interface SearchableSelectFieldProps {
    label: string;
    /** Hidden input name so the chosen value is submitted with the form. */
    name: string;
    options: SearchableSelectOption[];
    value: string;
    onChange: (option: SearchableSelectOption) => void;
    /** Trigger text while nothing is selected. */
    placeholder: string;
    searchPlaceholder: string;
    /** Shown when the query matches no option. */
    emptyLabel: string;
    hint?: string;
    error?: string;
    className?: string;
}

export default function SearchableSelectField({
    label,
    name,
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    hint,
    error,
    className,
}: SearchableSelectFieldProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selected = useMemo(
        () => options.find((option) => option.value === value) ?? null,
        [options, value],
    );

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (needle === '') {
            return options;
        }

        return options.filter((option) =>
            [
                option.label,
                option.description ?? '',
                option.badge ?? '',
                ...(option.keywords ?? []),
            ].some((text) => text.toLowerCase().includes(needle)),
        );
    }, [options, query]);

    // Outside clicks close the panel; the trigger and panel share one container
    // so clicks inside the search field never dismiss it.
    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);

        return () =>
            document.removeEventListener('mousedown', handlePointerDown);
    }, [open]);

    // Focus the search field whenever the panel opens; the query and highlight
    // are reset by the toggle handler so this effect only touches the DOM.
    useEffect(() => {
        if (!open) {
            return;
        }

        const frame = requestAnimationFrame(() => searchRef.current?.focus());

        return () => cancelAnimationFrame(frame);
    }, [open]);

    const toggle = () => {
        if (open) {
            setOpen(false);
            return;
        }

        setQuery('');
        setActiveIndex(0);
        setOpen(true);
    };

    const choose = (option: SearchableSelectOption) => {
        onChange(option);
        setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            setOpen(false);
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();

            if (filtered.length === 0) {
                return;
            }

            setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const option = filtered[activeIndex];

            if (option) {
                choose(option);
            }
        }
    };

    return (
        <FieldWrapper
            label={label}
            hint={hint}
            error={error}
            className={className}
        >
            <div ref={rootRef} className="relative">
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    onClick={toggle}
                    className={cn(
                        'flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        open && 'border-ring ring-[3px] ring-ring/50',
                    )}
                >
                    {selected ? (
                        <>
                            <span className="truncate">{selected.label}</span>
                            {selected.description ? (
                                <span className="truncate text-xs text-muted-foreground">
                                    {selected.description}
                                </span>
                            ) : null}
                            {selected.badge ? (
                                <span className="ms-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                                    {selected.badge}
                                </span>
                            ) : null}
                        </>
                    ) : (
                        <span className="flex-1 text-start text-muted-foreground">
                            {placeholder}
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            'size-4 shrink-0 text-muted-foreground transition-transform',
                            open && 'rotate-180',
                        )}
                    />
                </button>

                {open ? (
                    <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
                        <div className="relative border-b border-border">
                            <Search className="pointer-events-none absolute start-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                ref={searchRef}
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={searchPlaceholder}
                                className="w-full bg-transparent py-2 ps-8 pe-2 text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        <ul
                            role="listbox"
                            className="max-h-64 overflow-y-auto p-1"
                        >
                            {filtered.length === 0 ? (
                                <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                                    {emptyLabel}
                                </li>
                            ) : (
                                filtered.map((option, index) => (
                                    <li key={option.value}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={
                                                option.value === value
                                            }
                                            onMouseEnter={() =>
                                                setActiveIndex(index)
                                            }
                                            onClick={() => choose(option)}
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm',
                                                index === activeIndex &&
                                                    'bg-accent text-accent-foreground',
                                            )}
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate">
                                                    {option.label}
                                                </span>
                                                {option.description ? (
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {option.description}
                                                    </span>
                                                ) : null}
                                            </span>
                                            {option.badge ? (
                                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                                                    {option.badge}
                                                </span>
                                            ) : null}
                                            {option.value === value ? (
                                                <Check className="size-4 text-blue-600" />
                                            ) : null}
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                ) : null}

                <input type="hidden" name={name} value={value} />
            </div>
        </FieldWrapper>
    );
}
