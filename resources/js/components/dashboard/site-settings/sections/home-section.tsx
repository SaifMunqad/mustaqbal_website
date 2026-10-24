import HomeFeaturesEditor from '@/components/dashboard/site-settings/home-features-editor';
import HomeStatsEditor from '@/components/dashboard/site-settings/home-stats-editor';
import SettingsSection from '@/components/dashboard/site-settings/settings-section';
import {
    seedLists,
    seedScalars,
    type SiteSettingsPageProps,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { useSectionDirty } from '@/components/dashboard/site-settings/use-section-dirty';
import { TextField } from '@/components/form/form-fields';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/editor/language-tabs-editor';
import { cn } from '@/lib/utils';
import type { HomeFeature, HomeStat, LanguageOption } from '@/types';
import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HomeSectionProps {
    active: boolean;
    onDirtyChange: (dirty: boolean) => void;
}

/**
 * Home hero copy plus the localized quick-stats and feature lists. Text and
 * lists are edited per language; the hero image is shared across languages.
 */
export default function HomeSection({
    active,
    onDirtyChange,
}: HomeSectionProps) {
    const { settings, translations, languages } =
        usePage<SiteSettingsPageProps>().props;
    const { t } = useTranslation();

    const available = useMemo(() => languages?.available ?? [], [languages]);
    const defaultCode = languages?.default ?? 'en';

    const fields: TranslatableField[] = useMemo(
        () => [
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
        ],
        [t],
    );

    const [heroImage, setHeroImage] = useState(settings.home_hero_image ?? '');

    const seed: TranslationValues = useMemo(
        () =>
            seedScalars(available, translations, settings, defaultCode, fields),
        [available, translations, settings, defaultCode, fields],
    );
    const [values, setValues] = useState<TranslationValues>(seed);

    // Per-language state for the localized lists. Empty languages fall back to
    // the parent (default-language) list so the editor always shows a baseline.
    const [statsByCode, setStatsByCode] = useState<Record<string, HomeStat[]>>(
        () => seedLists(available, translations, settings, 'home_stats'),
    );
    const [featuresByCode, setFeaturesByCode] = useState<
        Record<string, HomeFeature[]>
    >(() => seedLists(available, translations, settings, 'home_features'));

    // Lists use their own language switcher, so keep its selection here.
    const [activeListCode, setActiveListCode] = useState<string>(
        available.find((entry) => entry.code === defaultCode)?.code ??
            available[0]?.code ??
            defaultCode,
    );

    const { dirty, markSaved } = useSectionDirty(
        { heroImage, values, statsByCode, featuresByCode },
        onDirtyChange,
    );

    return (
        <SettingsSection
            section="home"
            active={active}
            dirty={dirty}
            onSaved={markSaved}
        >
            {({ errors }) => (
                <>
                    <TextField
                        label={t('dashboard.settings.form.heroImageUrl')}
                        name="home_hero_image"
                        error={errors.home_hero_image}
                        placeholder={t(
                            'dashboard.settings.form.heroImagePlaceholder',
                        )}
                        value={heroImage}
                        onChange={(event) => setHeroImage(event.target.value)}
                    />

                    <LanguageTabsEditor
                        fields={fields}
                        translations={seed}
                        onChange={setValues}
                    />

                    {/* Language tabs for the localized stats/features lists. */}
                    <div className="mt-2 space-y-4">
                        <ListLanguageTabs
                            available={available}
                            activeCode={activeListCode}
                            defaultCode={defaultCode}
                            onChange={setActiveListCode}
                        />

                        {available.map((language) => (
                            <div
                                key={language.code}
                                hidden={activeListCode !== language.code}
                                className={cn(
                                    'space-y-4',
                                    activeListCode !== language.code &&
                                        'hidden',
                                )}
                                dir={language.dir}
                            >
                                <HomeStatsEditor
                                    stats={statsByCode[language.code] ?? []}
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
                                        featuresByCode[language.code] ?? []
                                    }
                                    onChange={(next) =>
                                        setFeaturesByCode((previous) => ({
                                            ...previous,
                                            [language.code]: next,
                                        }))
                                    }
                                    namePrefix={`translations.${language.code}`}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </SettingsSection>
    );
}

function ListLanguageTabs({
    available,
    activeCode,
    defaultCode,
    onChange,
}: {
    available: LanguageOption[];
    activeCode: string;
    defaultCode: string;
    onChange: (code: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-1 border-b border-border">
            {available.map((language) => (
                <button
                    key={language.code}
                    type="button"
                    onClick={() => onChange(language.code)}
                    className={cn(
                        'relative rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
                        activeCode === language.code
                            ? 'border-b-2 border-primary text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {language.name}
                    {language.code === defaultCode ? (
                        <span className="ms-1 text-xs text-muted-foreground">
                            *
                        </span>
                    ) : null}
                </button>
            ))}
        </div>
    );
}
