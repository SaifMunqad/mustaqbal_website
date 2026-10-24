/**
 * Brand block shared by the dashboard sidebar and the auth pages.
 *
 * Prefers the admin-managed logo and brand name from the shared `site` props,
 * falling back to the bundled vector mark and the translated default brand name.
 * Both children are meant to be rendered inside a flex row.
 */
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import type { SharedData } from '@/types';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { t } = useTranslation();
    const { site } = usePage<SharedData>().props;

    const name = site?.brand_name || site?.brand_short_name || t('brand.name');

    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                {site?.logo_url ? (
                    <img
                        src={site.logo_url}
                        alt={name}
                        className="size-full object-contain"
                    />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ms-1 grid min-w-0 flex-1 text-start text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {name}
                </span>
            </div>
        </>
    );
}
