import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/form/image-upload-field';
import HomeStatsEditor from '@/components/dashboard/site-settings/home-stats-editor';
import HomeFeaturesEditor from '@/components/dashboard/site-settings/home-features-editor';
import type { SiteBlockKind, SiteEntry } from './types';

interface SiteBlockPanelProps {
    open: boolean;
    onClose: () => void;
    kind: SiteBlockKind;
    languageName: string;
    dir: 'ltr' | 'rtl';
    entry: SiteEntry;
    heroImage: string;
    onPatch: (patch: Partial<SiteEntry>) => void;
    onHeroImage: (url: string) => void;
}

const TITLES: Record<SiteBlockKind, string> = {
    hero: 'Home hero',
    features: '“Why families choose us”',
    stats: 'Quick stats',
};

/**
 * Slide-over that edits one Site Settings home block (hero / features / stats)
 * for the currently selected editing language. Changes are staged in the parent
 * and committed by the editor's single Save (which persists them against the
 * SiteSetting model). Un-authored fields start blank so nothing leaks across
 * languages.
 */
export default function SiteBlockPanel({
    open,
    onClose,
    kind,
    languageName,
    dir,
    entry,
    heroImage,
    onPatch,
    onHeroImage,
}: SiteBlockPanelProps) {
    return (
        <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
            <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>{TITLES[kind]}</SheetTitle>
                    <SheetDescription>Editing in {languageName}.</SheetDescription>
                </SheetHeader>

                <div className="space-y-5 p-4 pt-2" dir={dir}>
                    {kind === 'hero' ? (
                        <>
                            <ImageUploadField
                                label="Hero image"
                                name="hero_image"
                                value={heroImage}
                                onChange={onHeroImage}
                                hint="Shared across all languages."
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="tagline">Tagline badge</Label>
                                <Input
                                    id="tagline"
                                    dir={dir}
                                    value={entry.tagline}
                                    onChange={(event) => onPatch({ tagline: event.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="home_title">Title</Label>
                                <Input
                                    id="home_title"
                                    dir={dir}
                                    value={entry.home_title}
                                    onChange={(event) => onPatch({ home_title: event.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="home_subtitle">Subtitle</Label>
                                <Textarea
                                    id="home_subtitle"
                                    rows={3}
                                    dir={dir}
                                    value={entry.home_subtitle}
                                    onChange={(event) => onPatch({ home_subtitle: event.target.value })}
                                />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="cta_primary">Primary button</Label>
                                    <Input
                                        id="cta_primary"
                                        dir={dir}
                                        value={entry.home_cta_primary}
                                        onChange={(event) => onPatch({ home_cta_primary: event.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cta_secondary">Secondary button</Label>
                                    <Input
                                        id="cta_secondary"
                                        dir={dir}
                                        value={entry.home_cta_secondary}
                                        onChange={(event) => onPatch({ home_cta_secondary: event.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Button links are fixed (Programs / Contact). Blank text
                                falls back to the built-in wording on the live site.
                            </p>
                        </>
                    ) : null}

                    {kind === 'features' ? (
                        <HomeFeaturesEditor
                            features={entry.home_features}
                            onChange={(features) => onPatch({ home_features: features })}
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
                        Done
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
