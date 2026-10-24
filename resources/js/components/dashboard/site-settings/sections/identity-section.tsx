import SettingsSection from '@/components/dashboard/site-settings/settings-section';
import {
    seedScalars,
    type SiteSettingsPageProps,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { useSectionDirty } from '@/components/dashboard/site-settings/use-section-dirty';
import { ImageUploadField } from '@/components/form/image-upload-field';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/language-tabs-editor';
import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface IdentitySectionProps {
    active: boolean;
    onDirtyChange: (dirty: boolean) => void;
}

/**
 * Logos plus the brand wording shown across the public site. The text fields are
 * localized, so each language presents its own brand wording in the tabs editor.
 */
export default function IdentitySection({
    active,
    onDirtyChange,
}: IdentitySectionProps) {
    const { settings, translations, languages } =
        usePage<SiteSettingsPageProps>().props;
    const { t } = useTranslation();

    const available = useMemo(() => languages?.available ?? [], [languages]);
    const defaultCode = languages?.default ?? 'en';

    const fields: TranslatableField[] = useMemo(
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
                name: 'footer_text',
                label: t('dashboard.settings.form.footerText'),
                type: 'text',
                required: false,
            },
        ],
        [t],
    );

    // Brand assets are uploaded through the shared /dashboard/upload endpoint,
    // which returns a public URL kept in controlled state so the submitted hidden
    // input stays in sync.
    const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? '');
    const [reverseLogoUrl, setReverseLogoUrl] = useState(
        settings.reverse_logo_url ?? '',
    );

    const seed: TranslationValues = useMemo(
        () =>
            seedScalars(available, translations, settings, defaultCode, fields),
        [available, translations, settings, defaultCode, fields],
    );
    const [values, setValues] = useState<TranslationValues>(seed);

    const { dirty, markSaved } = useSectionDirty(
        { logoUrl, reverseLogoUrl, values },
        onDirtyChange,
    );

    return (
        <SettingsSection
            section="identity"
            active={active}
            dirty={dirty}
            onSaved={markSaved}
        >
            {({ errors }) => (
                <>
                    <ImageUploadField
                        label={t('dashboard.settings.form.logoLabel')}
                        name="logo_url"
                        value={logoUrl}
                        onChange={setLogoUrl}
                        error={errors.logo_url}
                        hint={t('dashboard.settings.form.logoHint')}
                    />

                    <ImageUploadField
                        label={t('dashboard.settings.form.reverseLogoLabel')}
                        name="reverse_logo_url"
                        value={reverseLogoUrl}
                        onChange={setReverseLogoUrl}
                        error={errors.reverse_logo_url}
                        hint={t('dashboard.settings.form.reverseLogoHint')}
                        previewClassName="h-20 w-auto object-contain"
                        dropzoneClassName="h-24 w-full"
                    />

                    <LanguageTabsEditor
                        fields={fields}
                        translations={seed}
                        onChange={setValues}
                    />
                </>
            )}
        </SettingsSection>
    );
}
