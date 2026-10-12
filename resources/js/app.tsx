import '../css/app.css';

import '@/i18n';
import { bootstrapLanguage } from '@/i18n';
import { ToastProvider, type FlashProps } from '@/components/toast';
import type { SharedData } from '@/types';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
