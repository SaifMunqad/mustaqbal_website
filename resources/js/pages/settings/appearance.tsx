import { Head } from '@inertiajs/react';

import AppearanceLanguage from '@/components/appearance-language';
import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: editAppearance().url,
    },
];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Appearance settings"
                        description="Update your account's appearance settings"
                    />
                    <AppearanceTabs />

                    <div className="space-y-3">
                        <HeadingSmall
                            title="Language"
                            description="Choose the language used across the site. Your selection is saved on this device."
                        />
                        <AppearanceLanguage />
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
