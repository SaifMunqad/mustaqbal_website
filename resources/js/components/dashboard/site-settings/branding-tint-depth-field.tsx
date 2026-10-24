import {
    TINT_DEPTHS,
    TINT_DEPTH_LABELS,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TintDepth } from '@/types';
import { useTranslation } from 'react-i18next';

interface BrandingTintDepthFieldProps {
    label: string;
    value: TintDepth;
    onChange: (value: TintDepth) => void;
    hint?: string;
}

/**
 * Segmented control for how strongly the brand color is tinted into sections and
 * cards. Only three fixed steps are offered on purpose: the exact alpha stays in
 * the backend so the palette cannot be driven into unreadable territory.
 */
export default function BrandingTintDepthField({
    label,
    value,
    onChange,
    hint,
}: BrandingTintDepthFieldProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <input type="hidden" name="tint_depth" value={value} />
            <div
                role="group"
                aria-label={label}
                className="inline-flex w-fit rounded-lg border border-border p-1"
            >
                {TINT_DEPTHS.map((depth) => (
                    <button
                        key={depth}
                        type="button"
                        aria-pressed={value === depth}
                        onClick={() => onChange(depth)}
                        className={cn(
                            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            value === depth
                                ? 'bg-primary text-primary-foreground'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                        )}
                    >
                        {t(TINT_DEPTH_LABELS[depth])}
                    </button>
                ))}
            </div>
            {hint ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}
