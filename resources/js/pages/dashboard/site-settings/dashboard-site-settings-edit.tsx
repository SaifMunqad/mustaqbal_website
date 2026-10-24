import DashboardPage from '@/components/dashboard/dashboard-page';
import HomeFeaturesEditor from '@/components/dashboard/site-settings/home-features-editor';
import HomeStatsEditor from '@/components/dashboard/site-settings/home-stats-editor';
import {
    buildEmbedUrl,
    Group,
    type SiteSettingRecord,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { TextField } from '@/components/form-fields';
import { ImageUploadField } from '@/components/form/image-upload-field';
import GoogleLocationPicker, {
    PickedLocation,
} from '@/components/google-location-picker';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/language-tabs-editor';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { cn } from '@/lib/utils';
import type {
    HomeFeature,
    HomeStat,
    LanguageOption,
    SharedData,
} from '@/types';
import { Form, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Existing translations keyed by `code -> field -> value`, sent by the controller. */
type SettingsTranslations = Record<
    string,
    {
        brand_name?: string;
        brand_short_name?: string;
        tagline?: string;
        home_title?: string;
        home_subtitle?: string;
        home_cta_primary?: string;
        home_cta_secondary?: string;
        footer_text?: string;
        home_stats?: HomeStat[];
        home_features?: HomeFeature[];
    }
>;

// The localized scalar fields are built inside the component so their labels
// follow the active UI language. Branding (name + short name) leads the group so
// each language can present its own brand wording; the default language is
// required and others fall back to it.

export default function DashboardSiteSettingsEdit() {
    const { settings, translations, mapsKey } = usePage<{
        settings: SiteSettingRecord;
        translations: SettingsTranslations;
        mapsKey?: string | null;
    }>().props;
    const { languages } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const { onError } = useFormToast(t('dashboard.settings.updated'));

    const scalarFields: TranslatableField[] = useMemo(
        () => [
            {
                name: 'brand_name',
                label: t('dashboard.settings.form.brandName'),
                type: 'text',
            },
            {
                name: 'brand_short_name',
                label: t('dashboard.settings.form.shortName'),
                type: 'text',
            },
            {
                name: 'tagline',
                label: t('dashboard.settings.form.tagline'),
                type: 'text',
                required: false,
            },
            {
                name: 'home_title',
                label: t('dashboard.settings.form.homeTitle'),
                type: 'text',
                required: false,
            },
            {
                name: 'home_subtitle',
                label: t('dashboard.settings.form.homeSubtitle'),
                type: 'textarea',
                required: false,
                rows: 3,
            },
            {
                name: 'home_cta_primary',
                label: t('dashboard.settings.form.primaryCta'),
                type: 'text',
                required: false,
            },
            {
                name: 'home_cta_secondary',
                label: t('dashboard.settings.form.secondaryCta'),
                type: 'text',
                required: false,
            },
            {
                name: 'footer_text',
                label: t('dashboard.settings.form.footerText'),
                type: 'text',
                required: false,
            },
        ],
        [t],
    );

    const available: LanguageOption[] = useMemo(
        () => languages?.available ?? [],
        [languages],
    );
    const defaultCode = languages?.default ?? 'en';

    // Brand assets are uploaded through the shared /dashboard/upload endpoint,
    // which returns a public URL kept in controlled state so the live preview
    // and the submitted hidden input stay in sync.
    const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? '');

    // Map/location state is controlled so the picker, the derived embed URL and
    // the address box stay in sync before submit.
    const [address, setAddress] = useState(settings.address ?? '');
    const [latitude, setLatitude] = useState<number | null>(
        settings.map_latitude ?? null,
    );
    const [longitude, setLongitude] = useState<number | null>(
        settings.map_longitude ?? null,
    );
    const [zoom, setZoom] = useState<number>(settings.map_zoom ?? 15);
    const [embedUrl, setEmbedUrl] = useState(settings.map_embed_url ?? '');

    // Per-language state for the localized home lists. Empty languages fall back
    // to the parent (default-language) list so the editor always shows a baseline.
    const [statsByCode, setStatsByCode] = useState<Record<string, HomeStat[]>>(
        () => seedLists(available, translations, settings, 'home_stats'),
    );
    const [featuresByCode, setFeaturesByCode] = useState<
        Record<string, HomeFeature[]>
    >(() => seedLists(available, translations, settings, 'home_features'));

    // Seed the scalar tabs editor: saved value, else the parent default for the
    // default language, else empty for the rest.
    const scalarTranslations: TranslationValues = useMemo(
        () =>
            seedScalars(
                available,
                translations,
                settings,
                defaultCode,
                scalarFields,
            ),
        [available, translations, settings, defaultCode, scalarFields],
    );

    // Language tabs for the localized lists (all tabs stay mounted so one submit
    // carries every language's arrays).
    const [activeListCode, setActiveListCode] = useState<string>(
        available.find((entry) => entry.code === defaultCode)?.code ??
            available[0]?.code ??
            defaultCode,
    );

    const handlePick = (location: PickedLocation) => {
        setLatitude(location.latitude);
        setLongitude(location.longitude);
        setZoom(location.zoom);
        setEmbedUrl(
            buildEmbedUrl(location.latitude, location.longitude, location.zoom),
        );

        if (location.address) {
            setAddress(location.address);
        }
    };

    return (
        <DashboardPage titleKey="dashboard.settings.editTitle">
            <Form
                action="/dashboard/site-settings"
                method="put"
                onError={onError}
                className="grid gap-4"
            >
                {({ errors, processing }) => (
                    <>
                        <Group
                            title={t('dashboard.settings.form.localizedTitle')}
                        >
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t(
                                    'dashboard.settings.form.localizedDescription',
                                )}
                            </p>
                            <LanguageTabsEditor
                                fields={scalarFields}
                                translations={scalarTranslations}
                            />
                        </Group>

                        <Group
                            title={t('dashboard.settings.form.brandingTitle')}
                        >
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t(
                                    'dashboard.settings.form.brandingDescription',
                                )}
                            </p>
                            <ImageUploadField
                                label={t('dashboard.settings.form.logoLabel')}
                                name="logo_url"
                                value={logoUrl}
                                onChange={setLogoUrl}
                                error={errors.logo_url}
                                hint={t('dashboard.settings.form.logoHint')}
                            />
                        </Group>

                        <Group
                            title={t('dashboard.settings.form.homePageTitle')}
                        >
                            <TextField
                                label={t(
                                    'dashboard.settings.form.heroImageUrl',
                                )}
                                name="home_hero_image"
                                error={errors.home_hero_image}
                                placeholder={t(
                                    'dashboard.settings.form.heroImagePlaceholder',
                                )}
                                defaultValue={settings.home_hero_image ?? ''}
                            />

                            {/* Language tabs for the localized stats/features lists. */}
                            <div className="mt-2 space-y-4">
                                <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
                                    {available.map((language) => (
                                        <button
                                            key={language.code}
                                            type="button"
                                            onClick={() =>
                                                setActiveListCode(language.code)
                                            }
                                            className={cn(
                                                'relative rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
                                                activeListCode === language.code
                                                    ? 'border-b-2 border-primary text-foreground'
                                                    : 'text-slate-500 hover:text-foreground',
                                            )}
                                        >
                                            {language.name}
                                            {language.code === defaultCode ? (
                                                <span className="ms-1 text-xs text-slate-400">
                                                    *
                                                </span>
                                            ) : null}
                                        </button>
                                    ))}
                                </div>

                                {available.map((language) => (
                                    <div
                                        key={language.code}
                                        hidden={
                                            activeListCode !== language.code
                                        }
                                        className={cn(
                                            'space-y-4',
                                            activeListCode !== language.code &&
                                                'hidden',
                                        )}
                                        dir={language.dir}
                                    >
                                        <HomeStatsEditor
                                            stats={
                                                statsByCode[language.code] ?? []
                                            }
                                            onChange={(next) =>
                                                setStatsByCode((previous) => ({
                                                    ...previous,
                                                    [language.code]: next,
                                                }))
                                            }
                                            namePrefix={`translations.${language.code}`}
                                        />
                                        <HomeFeaturesEditor
                                            features={
                                                featuresByCode[language.code] ??
                                                []
                                            }
                                            onChange={(next) =>
                                                setFeaturesByCode(
                                                    (previous) => ({
                                                        ...previous,
                                                        [language.code]: next,
                                                    }),
                                                )
                                            }
                                            namePrefix={`translations.${language.code}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Group>

                        <Group
                            title={t('dashboard.settings.form.contactTitle')}
                        >
                            <TextField
                                label={t('dashboard.settings.form.email')}
                                name="contact_email"
                                type="email"
                                error={errors.contact_email}
                                defaultValue={settings.contact_email ?? ''}
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <TextField
                                    label={t(
                                        'dashboard.settings.form.primaryPhone',
                                    )}
                                    name="contact_phone_primary"
                                    error={errors.contact_phone_primary}
                                    defaultValue={
                                        settings.contact_phone_primary ?? ''
                                    }
                                />
                                <TextField
                                    label={t(
                                        'dashboard.settings.form.secondaryPhone',
                                    )}
                                    name="contact_phone_secondary"
                                    error={errors.contact_phone_secondary}
                                    defaultValue={
                                        settings.contact_phone_secondary ?? ''
                                    }
                                />
                            </div>
                            <TextField
                                label={t('dashboard.settings.form.address')}
                                name="address"
                                error={errors.address}
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                            />

                            <GoogleLocationPicker
                                apiKey={mapsKey ?? ''}
                                latitude={latitude}
                                longitude={longitude}
                                zoom={zoom}
                                onChange={handlePick}
                            />

                            {/* Persisted coordinates. */}
                            <input
                                type="hidden"
                                name="map_latitude"
                                value={latitude ?? ''}
                            />
                            <input
                                type="hidden"
                                name="map_longitude"
                                value={longitude ?? ''}
                            />
                            <input type="hidden" name="map_zoom" value={zoom} />

                            {mapsKey ? (
                                // With a key the embed URL is derived from the pin.
                                <input
                                    type="hidden"
                                    name="map_embed_url"
                                    value={embedUrl}
                                />
                            ) : (
                                // Without a key the admin pastes it directly.
                                <TextField
                                    label={t(
                                        'dashboard.settings.form.mapEmbedUrl',
                                    )}
                                    name="map_embed_url"
                                    error={errors.map_embed_url}
                                    placeholder={t(
                                        'dashboard.settings.form.mapEmbedPlaceholder',
                                    )}
                                    defaultValue={settings.map_embed_url ?? ''}
                                    hint={t(
                                        'dashboard.settings.form.mapEmbedHint',
                                    )}
                                />
                            )}
                        </Group>

                        <Group title={t('dashboard.settings.form.socialTitle')}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <TextField
                                    label={t(
                                        'dashboard.settings.form.facebook',
                                    )}
                                    name="social_facebook"
                                    error={errors.social_facebook}
                                    defaultValue={
                                        settings.social_facebook ?? ''
                                    }
                                />
                                <TextField
                                    label={t(
                                        'dashboard.settings.form.instagram',
                                    )}
                                    name="social_instagram"
                                    error={errors.social_instagram}
                                    defaultValue={
                                        settings.social_instagram ?? ''
                                    }
                                />
                                <TextField
                                    label={t('dashboard.settings.form.twitter')}
                                    name="social_twitter"
                                    error={errors.social_twitter}
                                    defaultValue={settings.social_twitter ?? ''}
                                />
                                <TextField
                                    label={t('dashboard.settings.form.youtube')}
                                    name="social_youtube"
                                    error={errors.social_youtube}
                                    defaultValue={settings.social_youtube ?? ''}
                                />
                            </div>
                            <TextField
                                label={t('dashboard.settings.form.whatsapp')}
                                name="social_whatsapp"
                                error={errors.social_whatsapp}
                                defaultValue={settings.social_whatsapp ?? ''}
                            />
                        </Group>

                        <Button
                            className="w-fit"
                            type="submit"
                            disabled={processing}
                        >
                            {t('dashboard.settings.form.save')}
                        </Button>
                    </>
                )}
            </Form>
        </DashboardPage>
    );
}

/**
 * Seed the scalar tabs editor from saved translations, falling back to the
 * parent (default-language) values for the default language so the editor shows
 * the current English copy before any translation row exists.
 */
function seedScalars(
    available: LanguageOption[],
    translations: SettingsTranslations,
    settings: SiteSettingRecord,
    defaultCode: string,
    scalarFields: TranslatableField[],
): TranslationValues {
    const fields = scalarFields.map((field) => field.name);
    const out: TranslationValues = {};

    for (const language of available) {
        const saved = translations[language.code] ?? {};
        const isDefault = language.code === defaultCode;

        out[language.code] = {};
        for (const field of fields) {
            const savedValue =
                saved[field as keyof SettingsTranslations[string]];
            const fallback = isDefault
                ? (settings[field as keyof SiteSettingRecord] ?? '')
                : '';
            out[language.code][field] =
                typeof savedValue === 'string'
                    ? savedValue
                    : String(fallback ?? '');
        }
    }

    return out;
}

/**
 * Seed a localized list per language, falling back to the parent's default list
 * when that language has no saved rows yet.
 */
function seedLists<T extends HomeStat | HomeFeature>(
    available: LanguageOption[],
    translations: SettingsTranslations,
    settings: SiteSettingRecord,
    key: 'home_stats' | 'home_features',
): Record<string, T[]> {
    const fallback = (settings[key] ?? []) as T[];
    const out: Record<string, T[]> = {};

    for (const language of available) {
        out[language.code] =
            (translations[language.code]?.[key] as T[] | undefined) ?? fallback;
    }

    return out;
}
