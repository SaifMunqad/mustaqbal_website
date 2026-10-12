import '../css/app.css';

import '@/i18n';
import { bootstrapLanguage } from '@/i18n';
import { ToastProvider, type FlashProps } from '@/components/toast';
import type { SharedData, SiteSettings } from '@/types';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/**
 * Keep the browser tab icon in sync with the admin-managed site favicon.
 *
 * The favicon lives in the server-rendered <head>, which Inertia does not
 * re-render on partial navigations. Without this, a favicon saved from the
 * dashboard would only appear after a hard reload. The stored value is made
 * relative to sidestep host/port mismatches with APP_URL.
 */
function toRelativeUrl(url: string): string {
    try {
        const parsed = new URL(url, window.location.origin);
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return url;
    }
}

function applyFavicon(faviconUrl?: string | null) {
    const href = faviconUrl ? toRelativeUrl(faviconUrl) : '/favicon.ico';
    const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']");

    if (existing) {
        existing.href = href;
    } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = href;
        document.head.appendChild(link);
    }
}

router.on('navigate', (event) => {
    const site = event.detail.page.props.site as SiteSettings | undefined;
    applyFavicon(site?.favicon_url);
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        // Seed the browser language cache from the server-resolved locale so a
        // visitor's first-priority language is remembered across visits.
        bootstrapLanguage((props as Partial<SharedData>).languages);

        const root = createRoot(el);

        const initialFlash = (props.initialPage.props as { flash?: FlashProps | null }).flash;

        root.render(
            <StrictMode>
                <ToastProvider initialFlash={initialFlash}>
                    <App {...props} />
                </ToastProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
