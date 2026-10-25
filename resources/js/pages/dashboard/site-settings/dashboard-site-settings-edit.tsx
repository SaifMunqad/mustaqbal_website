import DashboardPage from '@/components/dashboard/dashboard-page';
import AppearanceSection from '@/components/dashboard/site-settings/sections/appearance-section';
import ContactSection from '@/components/dashboard/site-settings/sections/contact-section';
import IdentitySection from '@/components/dashboard/site-settings/sections/identity-section';
import SocialSection from '@/components/dashboard/site-settings/sections/social-section';
import SettingsTabs from '@/components/dashboard/site-settings/settings-tabs';
import {
    SETTINGS_SECTION_KEYS,
    type SettingsSectionKey,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Site settings, split into one save scope per section (branding, appearance,
 * contact, social). Every section is mounted at once so switching tabs keeps
 * drafts, but only the active one is visible and each posts — and is validated —
 * on its own. Page layouts are not edited here; they belong to the page builder.
 */
export default function DashboardSiteSettingsEdit() {
    const { t } = useTranslation();

    const [section, setSection] = useState<SettingsSectionKey>('identity');
    const [dirtySections, setDirtySections] = useState<
        Record<SettingsSectionKey, boolean>
    >(() => ({
        identity: false,
        appearance: false,
        contact: false,
        social: false,
    }));

    const markSectionDirty = useCallback(
        (key: SettingsSectionKey, next: boolean) => {
            setDirtySections((previous) =>
                previous[key] === next
                    ? previous
                    : { ...previous, [key]: next },
            );
        },
        [],
    );

    // Stable per-section callbacks: the sections report dirty state through an
    // effect, so fresh closures on every render would re-fire it.
    const dirtyHandlers = useMemo(
        () =>
            Object.fromEntries(
                SETTINGS_SECTION_KEYS.map((key) => [
                    key,
                    (next: boolean) => markSectionDirty(key, next),
                ]),
            ) as Record<SettingsSectionKey, (dirty: boolean) => void>,
        [markSectionDirty],
    );

    const anyDirty = SETTINGS_SECTION_KEYS.some((key) => dirtySections[key]);
    const anyDirtyRef = useRef(anyDirty);

    useEffect(() => {
        anyDirtyRef.current = anyDirty;
    }, [anyDirty]);

    // Browser-level guard for reloads and external links.
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (!anyDirtyRef.current) {
                return;
            }

            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, []);

    // Inertia-level guard for dashboard links and history navigation.
    useEffect(() => {
        return router.on('before', (event) => {
            if (!anyDirtyRef.current) {
                return;
            }

            // A section save is what the page is for; never intercept it.
            if (
                event.detail.visit.url.pathname === '/dashboard/site-settings'
            ) {
                return;
            }

            if (!window.confirm(t('dashboard.settings.form.unsavedConfirm'))) {
                return false;
            }
        });
    }, [t]);

    // Bring the newly selected panel into view; sections differ a lot in height,
    // so keeping the previous scroll offset would land in empty space.
    const scrollToPanel = useRef(false);

    useEffect(() => {
        if (!scrollToPanel.current) {
            return;
        }

        document
            .getElementById(`settings-panel-${section}`)
            ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, [section]);

    const handleSectionChange = (next: SettingsSectionKey) => {
        scrollToPanel.current = true;
        setSection(next);
    };

    return (
        <DashboardPage titleKey="dashboard.settings.editTitle">
            <SettingsTabs
                active={section}
                dirtySections={dirtySections}
                onChange={handleSectionChange}
            />

            <IdentitySection
                active={section === 'identity'}
                onDirtyChange={dirtyHandlers.identity}
            />
            <AppearanceSection
                active={section === 'appearance'}
                onDirtyChange={dirtyHandlers.appearance}
            />
            <ContactSection
                active={section === 'contact'}
                onDirtyChange={dirtyHandlers.contact}
            />
            <SocialSection
                active={section === 'social'}
                onDirtyChange={dirtyHandlers.social}
            />
        </DashboardPage>
    );
}
