import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const HEX = /^#[0-9a-f]{6}$/;

/** Never hand an invalid value to <input type="color">; it would reset to black. */
const FALLBACK = '#2563eb';

interface BrandingColorFieldProps {
    label: string;
    name: string;
    /** `''` means "not set" (the palette then uses its default / auto value). */
    value: string;
    /** Color swatched while the field is empty, i.e. the derived one. */
    placeholderColor?: string;
    onChange: (value: string) => void;
    hint?: string;
    error?: string;
    /** Adds an "Auto" button that clears the field (optional accent color). */
    autoLabel?: string;
}

/**
 * Hex color picker: a native swatch for quick picking plus a text field for a
 * brand-guideline hex. Emits the committed value through a hidden input, so it
 * posts with the surrounding Inertia <Form> like every other field on the page.
 */
export default function BrandingColorField({
    label,
    name,
    value,
    placeholderColor = FALLBACK,
    onChange,
    hint,
    error,
    autoLabel,
}: BrandingColorFieldProps) {
    const { t } = useTranslation();
    const swatch = HEX.test(value.toLowerCase())
        ? value.toLowerCase()
        : placeholderColor;
    const invalid = value !== '' && !HEX.test(value.toLowerCase());

    const handleText = (raw: string) => {
        const next = raw.trim().startsWith('#') ? raw.trim() : `#${raw.trim()}`;

        // Allow partial typing (#, #25, #2563e) but nothing longer than a hex.
        if (next.length <= 7) {
            onChange(next.toLowerCase());
        }
    };

    return (
        <div className="grid gap-2">
            <Label htmlFor={`branding-${name}`}>{label}</Label>
            <input type="hidden" name={name} value={value} />
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={swatch}
                    onChange={(event) =>
                        onChange(event.target.value.toLowerCase())
                    }
                    aria-label={label}
                    className="size-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
                <Input
                    id={`branding-${name}`}
                    value={value}
                    dir="ltr"
                    spellCheck={false}
                    placeholder={placeholderColor}
                    onChange={(event) => handleText(event.target.value)}
                    className={cn(
                        'w-32 font-mono text-sm',
                        invalid && 'border-destructive',
                    )}
                />
                {autoLabel ? (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className={cn(
                            'rounded-md border px-2 py-1.5 text-xs font-medium transition',
                            value === ''
                                ? 'border-primary text-primary'
                                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                        )}
                    >
                        {autoLabel}
                    </button>
                ) : null}
            </div>
            {invalid ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {t('dashboard.settings.form.invalidColor')}
                </p>
            ) : hint ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
            {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
