import { cn } from '@/lib/utils';
import type { BrandPalette } from '@/types';
import { CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Frozen page backgrounds, mirrored from app.css. They are part of the preview
 * only so a scoped subtree can render light and dark side by side; branding
 * never changes them.
 */
const BASE_LIGHT = {
    '--app-bg': '#fdfdfc',
    '--app-bg-header': 'rgb(255 255 255 / 0.9)',
};

const BASE_DARK = {
    '--app-bg': '#0a0a0a',
    '--app-bg-header': 'rgb(18 18 18 / 0.9)',
};

interface BrandingPalettePreviewProps {
    palette: BrandPalette;
    brandName?: string | null;
    reverseLogoUrl?: string | null;
}

/**
 * Miniature of the public site rendered with the palette being edited. All the
 * tokens are set on the wrapper, so the `bg-brand*` / `text-ink*` utilities read
 * from this subtree instead of the global palette.
 */
export default function BrandingPalettePreview({
    palette,
    brandName,
    reverseLogoUrl,
}: BrandingPalettePreviewProps) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'light' | 'dark'>('light');

    const vars = (mode === 'light' ? BASE_LIGHT : BASE_DARK) as CSSProperties;
    const tokens = mode === 'light' ? palette.light : palette.dark;
    const style = { ...vars, ...(tokens as CSSProperties) };

    const onBrand =
        mode === 'light'
            ? palette.contrast.on_brand
            : palette.contrast.on_dark_brand;
    const onPage =
        mode === 'light'
            ? palette.contrast.on_page
            : palette.contrast.on_dark_page;

    const name = brandName?.trim() || t('dashboard.settings.form.previewBrand');

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">
                    {t('dashboard.settings.form.previewTitle')}
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                    {(['light', 'dark'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={mode === option}
                            onClick={() => setMode(option)}
                            className={cn(
                                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                                mode === option
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                            )}
                        >
                            {t(
                                option === 'light'
                                    ? 'dashboard.settings.form.previewLight'
                                    : 'dashboard.settings.form.previewDark',
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div
                style={style}
                className="overflow-hidden rounded-xl border border-border"
            >
                {/* Nav bar (surface frozen, brand on the mark and active link) */}
                <div className="flex items-center gap-2 border-b border-brand-border bg-app-bg-header px-3 py-2">
                    <span className="size-6 rounded-md bg-brand" />
                    <span className="text-sm font-semibold text-ink">
                        {name}
                    </span>
                    <div className="ms-auto flex items-center gap-3 text-xs">
                        <span className="font-medium text-brand-ink">
                            {t('dashboard.settings.form.previewNavHome')}
                        </span>
                        <span className="text-ink-muted">
                            {t('dashboard.settings.form.previewNavAbout')}
                        </span>
                    </div>
                </div>

                <div className="grid gap-3 bg-app-bg p-3">
                    {/* Section band: brand-soft */}
                    <div className="rounded-lg bg-brand-soft p-3">
                        <p className="text-sm font-semibold text-ink">
                            {t('dashboard.settings.form.previewBand')}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                            {t('dashboard.settings.form.previewBody')}
                        </p>
                    </div>

                    {/* Card: brand-soft-strong with brand border + actions */}
                    <div className="rounded-lg border border-brand-border bg-brand-soft-strong p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-fg"
                            >
                                {t('dashboard.settings.form.previewPrimary')}
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-brand-border bg-app-bg px-3 py-1.5 text-xs font-medium text-brand-ink"
                            >
                                {t('dashboard.settings.form.previewSecondary')}
                            </button>
                            <span className="rounded-full bg-accent-brand px-2 py-0.5 text-[10px] font-semibold text-accent-brand-fg">
                                {t('dashboard.settings.form.previewAccent')}
                            </span>
                        </div>
                    </div>

                    {/* Inverted band: brand-deep with the reverse logo */}
                    <div className="flex items-center gap-2 rounded-lg bg-brand-deep px-3 py-2">
                        {reverseLogoUrl ? (
                            <img
                                src={reverseLogoUrl}
                                alt={name}
                                className="h-6 w-auto"
                            />
                        ) : (
                            <span className="text-sm font-semibold text-brand-deep-fg">
                                {name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
                <ContrastBadge
                    label={t('dashboard.settings.form.contrastOnBrand', {
                        ratio: onBrand,
                    })}
                    ratio={onBrand}
                />
                <ContrastBadge
                    label={t('dashboard.settings.form.contrastOnPage', {
                        ratio: onPage,
                    })}
                    ratio={onPage}
                />
                <span className="text-muted-foreground">
                    {Math.min(onBrand, onPage) >= 4.5
                        ? t('dashboard.settings.form.contrastPass')
                        : t('dashboard.settings.form.contrastWarn')}
                </span>
            </div>
        </div>
    );
}

function ContrastBadge({ label, ratio }: { label: string; ratio: number }) {
    return (
        <span
            className={cn(
                'rounded-full px-2 py-0.5 font-medium',
                ratio >= 4.5
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
            )}
        >
            {label}
        </span>
    );
}
