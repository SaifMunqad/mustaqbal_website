import HomeFeaturesEditor from '@/components/dashboard/site-settings/home-features-editor';
import HomeStatsEditor from '@/components/dashboard/site-settings/home-stats-editor';
import { ImageUploadField } from '@/components/form/image-upload-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { LanguageOption } from '@/types';
import { useTranslation } from 'react-i18next';
import type { SiteBlockKind, SiteEntry } from './types';

interface SiteBlockPanelProps {
    open: boolean;
    onClose: () => void;
    kind: SiteBlockKind;
    dir: 'ltr' | 'rtl';
    entry: SiteEntry;
    heroImage: string;
    onPatch: (patch: Partial<SiteEntry>) => void;
    onHeroImage: (url: string) => void;
    /** Active languages offered as in-drawer tabs so the admin can switch the
     *  editing language without closing the panel and using the top toolbar. */
    languages: LanguageOption[];
    activeLang: string;
    defaultCode: string;
    onLangChange: (code: string) => void;
}

// i18n key (under dashboard.homeSections.visual.blocks) per block kind, used for
// both the canvas frame label and this drawer's title.
const TITLE_KEYS: Record<SiteBlockKind, string> = {
    hero: 'hero',
    features: 'features',
    stats: 'stats',
};

/**
 * Slide-over that edits one Site Settings home block (hero / features / stats).
 * A language tab bar lets every active language be edited from inside the panel,
 * so there is no need to close it and change the editor's top-level language.
 * Changes are staged in the parent and committed by the editor's single Save
 * (which persists them against the SiteSetting model). Un-authored fields start
 * blank so nothing leaks across languages; the live site falls back to the
 * default language (marked *) for anything left empty.
 */
export default function SiteBlockPanel({
    open,
    onClose,
    kind,
    dir,
    entry,
    heroImage,
    onPatch,
    onHeroImage,
    languages,
    activeLang,
    defaultCode,
    onLangChange,
}: SiteBlockPanelProps) {
    const { t } = useTranslation();

    // Hide the switcher for a single-language site: nothing to toggle.
    const showTabs = languages.length > 1;

    return (
        <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-y-auto sm:max-w-md"
            >
                <SheetHeader>
                    <SheetTitle>
                        {t(
                            `dashboard.homeSections.visual.blocks.${TITLE_KEYS[kind]}`,
                        )}
                    </SheetTitle>
                    {showTabs ? (
                        <SheetDescription>
                            {t(
                                'dashboard.homeSections.visual.languageHint',
                                'Pick a language to edit this block in that language.',
                            )}
                        </SheetDescription>
                    ) : null}
                </SheetHeader>

                {showTabs ? (
                    <div className="flex flex-wrap gap-1 border-b border-border px-4">
                        {languages.map((language) => (
                            <button
                                key={language.code}
                                type="button"
                                onClick={() => onLangChange(language.code)}
                                className={cn(
                                    'relative rounded-t-lg px-3 py-2 text-sm font-medium transition-colors',
                                    activeLang === language.code
                                        ? 'border-b-2 border-primary text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {language.name}
                                {language.code === defaultCode ? (
                                    <span className="ms-1 text-xs text-muted-foreground">
                                        *
                                    </span>
                                ) : null}
                            </button>
                        ))}
                    </div>
                ) : null}

                <div className="space-y-5 p-4 pt-2" dir={dir}>
                    {kind === 'hero' ? (
                        <>
                            <ImageUploadField
                                label={t(
                                    'dashboard.homeSections.visual.fields.heroImage',
                                )}
                                name="hero_image"
                                value={heroImage}
                                onChange={onHeroImage}
                                hint={t(
                                    'dashboard.homeSections.visual.fields.sharedAcrossLanguages',
                                )}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="tagline">
                                    {t(
                                        'dashboard.homeSections.visual.fields.tagline',
                                    )}
                                </Label>
                                <Input
                                    id="tagline"
                                    dir={dir}
                                    value={entry.tagline}
                                    onChange={(event) =>
                                        onPatch({ tagline: event.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="home_title">
                                    {t(
                                        'dashboard.homeSections.visual.fields.title',
                                    )}
                                </Label>
                                <Input
                                    id="home_title"
                                    dir={dir}
                                    value={entry.home_title}
                                    onChange={(event) =>
                                        onPatch({
                                            home_title: event.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="home_subtitle">
                                    {t(
                                        'dashboard.homeSections.visual.fields.subtitle',
                                    )}
                                </Label>
                                <Textarea
                                    id="home_subtitle"
                                    rows={3}
                                    dir={dir}
                                    value={entry.home_subtitle}
                                    onChange={(event) =>
                                        onPatch({
                                            home_subtitle: event.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="cta_primary">
                                        {t(
                                            'dashboard.homeSections.visual.fields.primaryButton',
                                        )}
                                    </Label>
                                    <Input
                                        id="cta_primary"
                                        dir={dir}
                                        value={entry.home_cta_primary}
                                        onChange={(event) =>
                                            onPatch({
                                                home_cta_primary:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cta_secondary">
                                        {t(
                                            'dashboard.homeSections.visual.fields.secondaryButton',
                                        )}
                                    </Label>
                                    <Input
                                        id="cta_secondary"
                                        dir={dir}
                                        value={entry.home_cta_secondary}
                                        onChange={(event) =>
                                            onPatch({
                                                home_cta_secondary:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    'dashboard.homeSections.visual.fields.buttonLinksNote',
                                )}
                            </p>
                        </>
                    ) : null}

                    {kind === 'features' ? (
                        <HomeFeaturesEditor
                            features={entry.home_features}
                            onChange={(features) =>
                                onPatch({ home_features: features })
                            }
                        />
                    ) : null}

                    {kind === 'stats' ? (
                        <HomeStatsEditor
                            stats={entry.home_stats}
                            onChange={(stats) => onPatch({ home_stats: stats })}
                        />
                    ) : null}
                </div>

                <SheetFooter>
                    <Button type="button" onClick={onClose}>
                        {t('dashboard.homeSections.visual.done')}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
