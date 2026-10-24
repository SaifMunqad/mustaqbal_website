import SettingsSection from '@/components/dashboard/site-settings/settings-section';
import type { SiteSettingsPageProps } from '@/components/dashboard/site-settings/site-settings-shared';
import { useSectionDirty } from '@/components/dashboard/site-settings/use-section-dirty';
import { TextField } from '@/components/form/form-fields';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type SocialKey =
    | 'social_facebook'
    | 'social_instagram'
    | 'social_twitter'
    | 'social_youtube'
    | 'social_whatsapp';

/** Two-column URL fields; WhatsApp takes a number and gets its own row. */
const SOCIAL_INPUTS: Array<{ key: SocialKey; labelKey: string }> = [
    { key: 'social_facebook', labelKey: 'dashboard.settings.form.facebook' },
    { key: 'social_instagram', labelKey: 'dashboard.settings.form.instagram' },
    { key: 'social_twitter', labelKey: 'dashboard.settings.form.twitter' },
    { key: 'social_youtube', labelKey: 'dashboard.settings.form.youtube' },
];

interface SocialSectionProps {
    active: boolean;
    onDirtyChange: (dirty: boolean) => void;
}

/**
 * Social links shown in the public footer and contact page. Shared across
 * languages, so all five live in one compact section.
 */
export default function SocialSection({
    active,
    onDirtyChange,
}: SocialSectionProps) {
    const { settings } = usePage<SiteSettingsPageProps>().props;
    const { t } = useTranslation();

    const [values, setValues] = useState<Record<SocialKey, string>>(() => ({
        social_facebook: settings.social_facebook ?? '',
        social_instagram: settings.social_instagram ?? '',
        social_twitter: settings.social_twitter ?? '',
        social_youtube: settings.social_youtube ?? '',
        social_whatsapp: settings.social_whatsapp ?? '',
    }));

    const setField = (key: SocialKey, value: string) =>
        setValues((previous) => ({ ...previous, [key]: value }));

    const { dirty, markSaved } = useSectionDirty(values, onDirtyChange);

    return (
        <SettingsSection
            section="social"
            active={active}
            dirty={dirty}
            onSaved={markSaved}
        >
            {({ errors }) => (
                <>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {SOCIAL_INPUTS.map(({ key, labelKey }) => (
                            <TextField
                                key={key}
                                label={t(labelKey)}
                                name={key}
                                error={errors[key]}
                                value={values[key]}
                                onChange={(event) =>
                                    setField(key, event.target.value)
                                }
                            />
                        ))}
                    </div>

                    <TextField
                        label={t('dashboard.settings.form.whatsapp')}
                        name="social_whatsapp"
                        error={errors.social_whatsapp}
                        value={values.social_whatsapp}
                        onChange={(event) =>
                            setField('social_whatsapp', event.target.value)
                        }
                    />
                </>
            )}
        </SettingsSection>
    );
}
