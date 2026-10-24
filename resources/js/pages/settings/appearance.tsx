/**
 * Appearance settings: theme selection and language preference. Both controls
 * apply immediately — there is no save button.
 */
import { Head } from '@inertiajs/react';

import AppearanceLanguage from '@/components/appearance/appearance-language';
import AppearanceTabs from '@/components/appearance/appearance-tabs';
import HeadingSmall from '@/components/general/elements/heading-small';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';
import { useTranslation } from 'react-i18next';

export default function Appearance() {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.appearance.breadcrumb'),
            href: editAppearance().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.appearance.headTitle')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t('settings.appearance.title')}
                        description={t('settings.appearance.description')}
                    />
                    <AppearanceTabs />

                    <div className="space-y-3">
                        <HeadingSmall
                            title={t('settings.appearance.languageTitle')}
                            description={t(
                                'settings.appearance.languageDescription',
                            )}
                        />
                        <AppearanceLanguage />
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
