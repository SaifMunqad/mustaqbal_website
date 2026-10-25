import {
    SECTION_COPY,
    SETTINGS_SECTION_KEYS,
    type SettingsSectionKey,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { cn } from '@/lib/utils';
import {
    BadgeCheck,
    MapPin,
    Palette,
    Share2,
    type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SECTION_ICONS: Record<SettingsSectionKey, LucideIcon> = {
    identity: BadgeCheck,
    appearance: Palette,
    contact: MapPin,
    social: Share2,
};

interface SettingsTabsProps {
    active: SettingsSectionKey;
    dirtySections: Record<SettingsSectionKey, boolean>;
    onChange: (section: SettingsSectionKey) => void;
}

/**
 * Horizontal section switcher pinned under the page title. It keeps the whole
 * page short (one section on screen at a time) and marks the sections that still
 * hold unsaved drafts.
 */
export default function SettingsTabs({
    active,
    dirtySections,
    onChange,
}: SettingsTabsProps) {
    const { t } = useTranslation();

    return (
        <div
            role="tablist"
            aria-label={t('dashboard.settings.editTitle')}
            className="sticky top-0 z-40 -mx-4 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur"
        >
            <div className="flex w-fit gap-1">
                {SETTINGS_SECTION_KEYS.map((key) => {
                    const Icon = SECTION_ICONS[key];
                    const isActive = active === key;
                    const dirty = dirtySections[key];

                    return (
                        <button
                            key={key}
                            id={`settings-tab-${key}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`settings-panel-${key}`}
                            onClick={() => onChange(key)}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            <Icon className="size-4" aria-hidden />
                            {t(SECTION_COPY[key].titleKey)}
                            {dirty ? (
                                <>
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'size-1.5 rounded-full',
                                            isActive
                                                ? 'bg-primary-foreground'
                                                : 'bg-amber-500',
                                        )}
                                    />
                                    <span className="sr-only">
                                        {t('dashboard.settings.form.unsaved')}
                                    </span>
                                </>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
