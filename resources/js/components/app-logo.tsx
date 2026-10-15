import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { site } = usePage<SharedData>().props;

    const name = site?.brand_name || site?.brand_short_name || 'Laravel Starter Kit';

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
