import BrandingColorField from '@/components/dashboard/site-settings/branding-color-field';
import BrandingPalettePreview from '@/components/dashboard/site-settings/branding-palette-preview';
import BrandingTintDepthField from '@/components/dashboard/site-settings/branding-tint-depth-field';
import SettingsSection from '@/components/dashboard/site-settings/settings-section';
import TypographySection from '@/components/dashboard/site-settings/typography-section';
import type { SiteSettingsPageProps } from '@/components/dashboard/site-settings/site-settings-shared';
import { useBrandingPreview } from '@/components/dashboard/site-settings/use-branding-preview';
import { useSectionDirty } from '@/components/dashboard/site-settings/use-section-dirty';
import type { TintDepth } from '@/types';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AppearanceSectionProps {
    active: boolean;
    onDirtyChange: (dirty: boolean) => void;
}

/**
 * The palette inputs. Only the brand color is required; the accent falls back to
 * a derived companion and every other token (mid tones, deep bands, borders,
 * ink, dark-mode twin) is computed by the backend, so this section stays three
 * controls plus a live preview.
 */
export default function AppearanceSection({
    active,
    onDirtyChange,
}: AppearanceSectionProps) {
    const { settings, site } = usePage<SiteSettingsPageProps>().props;
    const { t } = useTranslation();

    // Initial palette comes from the shared props (site.theme.palette); the hook
    // refreshes it from the backend while the colors are being edited.
    const initialPalette = site?.theme?.palette ?? null;

    const [brandColor, setBrandColor] = useState(settings.brand_color ?? '');
    const [accentColor, setAccentColor] = useState(settings.accent_color ?? '');
    const [tintDepth, setTintDepth] = useState<TintDepth>(
        settings.tint_depth ?? 'subtle',
    );

    const palette = useBrandingPreview(
        {
            brand_color: brandColor,
            accent_color: accentColor,
            tint_depth: tintDepth,
        },
        initialPalette,
    );

    const { dirty, markSaved } = useSectionDirty(
        { brandColor, accentColor, tintDepth },
        onDirtyChange,
    );

    return (
        <>
            <SettingsSection
                section="appearance"
                active={active}
                dirty={dirty}
                onSaved={markSaved}
            >
            {({ errors }) => (
                <>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <BrandingColorField
                            label={t('dashboard.settings.form.brandColor')}
                            name="brand_color"
                            value={brandColor}
                            placeholderColor={initialPalette?.light['--brand']}
                            onChange={setBrandColor}
                            error={errors.brand_color}
                            hint={t('dashboard.settings.form.brandColorHint')}
                        />
                        <BrandingColorField
                            label={t('dashboard.settings.form.accentColor')}
                            name="accent_color"
                            value={accentColor}
                            placeholderColor={palette?.light['--accent']}
                            onChange={setAccentColor}
                            error={errors.accent_color}
                            hint={t('dashboard.settings.form.accentColorHint')}
                            autoLabel={t('dashboard.settings.form.accentAuto')}
                        />
                    </div>

                    <BrandingTintDepthField
                        label={t('dashboard.settings.form.tintDepth')}
                        value={tintDepth}
                        onChange={setTintDepth}
                        hint={t('dashboard.settings.form.tintDepthHint')}
                    />

                    {palette ? (
                        <BrandingPalettePreview
                            palette={palette}
                            brandName={settings.brand_short_name}
                            reverseLogoUrl={settings.reverse_logo_url}
                        />
                    ) : null}
                </>
            )}
            </SettingsSection>

            {/* Typography is per language, so it saves through its own endpoints
                instead of the branding form. */}
            <TypographySection active={active} />
        </>
    );
}
