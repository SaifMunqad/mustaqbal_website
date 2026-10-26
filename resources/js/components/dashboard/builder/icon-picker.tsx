/**
 * Searchable icon picker shared by the page builders.
 *
 * Lists every generated Heroicon (outline + solid, grouped by category) and
 * the social brand set, each tile rendered with its real glyph so the choice
 * is made on the picture, not a key name. Keys are stored namespaced
 * (`h:<name>`, `solid:h:<name>`, `social:<slug>`) and resolved everywhere by
 * `@/lib/icon-map`. The ~300-glyph catalog lives in a lazy chunk
 * (`loadIconCatalog`) that is already warm by the time this dialog opens.
 */
import BlockIcon from '@/components/home/block-icon';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    iconLabel,
    loadIconCatalog,
    resolveIcon,
    useIconCatalogReady,
    SOCIAL_OPTIONS,
    type HeroIconCatalogEntry,
} from '@/lib/icon-map';
import { X } from 'lucide-react';
import { createElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type IconSet = 'hero-outline' | 'hero-solid' | 'social';

interface IconTile {
    key: string;
    label: string;
    category: string;
    set: IconSet;
}

/** Build the picker's full tile list for the enabled sets. */
function buildTiles(
    entries: HeroIconCatalogEntry[],
    sets: IconSet[],
): IconTile[] {
    const tiles: IconTile[] = [];
    for (const entry of entries) {
        if (sets.includes('hero-outline') && entry.o) {
            tiles.push({
                key: `h:${entry.key}`,
                label: entry.label,
                category: entry.category,
                set: 'hero-outline',
            });
        }
        if (sets.includes('hero-solid') && entry.s) {
            tiles.push({
                key: `solid:h:${entry.key}`,
                label: entry.label,
                category: entry.category,
                set: 'hero-solid',
            });
        }
    }
    if (sets.includes('social')) {
        for (const option of SOCIAL_OPTIONS) {
            tiles.push({
                key: option.value,
                label: option.label,
                category: '',
                set: 'social',
            });
        }
    }
    return tiles;
}

const PAGE = 240;

export default function IconPicker({
    value,
    onChange,
    sets = ['hero-outline', 'hero-solid', 'social'],
    className,
}: {
    value: string;
    onChange: (key: string) => void;
    /** Which icon sets the picker offers; defaults to all of them. */
    sets?: IconSet[];
    className?: string;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeSet, setActiveSet] = useState<IconSet>(sets[0]);
    const [category, setCategory] = useState<string | null>(null);
    const [limit, setLimit] = useState(PAGE);
    const [catalog, setCatalog] = useState<HeroIconCatalogEntry[] | null>(null);

    const heroRequested = sets.some((s) => s.startsWith('hero'));
    // True once the lazy catalog chunk is registered; also drives the
    // "loading" placeholder so the grid never flashes empty tiles.
    const catalogReady = useIconCatalogReady();

    // Fetch the catalog entries the grid is built from (loadIconCatalog is
    // cached; the chunk may already be warm from a canvas preview).
    useEffect(() => {
        if (!catalogReady && heroRequested) {
            loadIconCatalog().then(setCatalog);
        }
    }, [catalogReady, heroRequested, catalog]);

    const allTiles = useMemo(
        () => buildTiles(catalog ?? [], sets),
        [catalog, sets],
    );

    // Categories belong to the hero sets; social is a flat list.
    const categories = useMemo(() => {
        const seen: string[] = [];
        for (const tile of allTiles) {
            if (tile.set === activeSet && tile.category && !seen.includes(tile.category)) {
                seen.push(tile.category);
            }
        }
        return seen;
    }, [allTiles, activeSet]);

    const query = search.trim().toLowerCase();
    const tiles = useMemo(
        () =>
            allTiles.filter(
                (tile) =>
                    tile.set === activeSet &&
                    (!category || tile.category === category) &&
                    (!query ||
                        tile.key.toLowerCase().includes(query) ||
                        tile.label.toLowerCase().includes(query) ||
                        tile.category.toLowerCase().includes(query)),
            ),
        [allTiles, activeSet, category, query],
    );

    const shown = tiles.slice(0, limit);

    const pick = (key: string) => {
        onChange(key);
        setOpen(false);
    };

    // Opening the dialog lands on the tab holding the current selection, so
    // the chosen glyph is visible (highlighted) instead of hidden on a tab
    // the admin has to find.
    const openPicker = () => {
        const set: IconSet = value.startsWith('solid:h:')
            ? 'hero-solid'
            : value.startsWith('h:')
              ? 'hero-outline'
              : value.startsWith('social:')
                ? 'social'
                : sets[0];
        reset({ set: sets.includes(set) ? set : sets[0] });
        setOpen(true);
    };

    const reset = (next: {
        search?: string;
        set?: IconSet;
        category?: string | null;
    }) => {
        if (next.search !== undefined) setSearch(next.search);
        if (next.set !== undefined) setActiveSet(next.set);
        if (next.category !== undefined) setCategory(next.category);
        setLimit(PAGE);
    };

    return (
        <>
            <div className={`flex items-center gap-2 ${className ?? ''}`}>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-w-0 flex-1 justify-start gap-2 font-normal"
                    onClick={openPicker}
                >
                    {value ? (
                        <BlockIcon
                            iconKey={value}
                            className="size-4 shrink-0"
                        />
                    ) : (
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/50" />
                    )}
                    <span className="truncate">
                        {value
                            ? iconLabel(value)
                            : t('dashboard.iconPicker.pick', 'Choose an icon')}
                    </span>
                </Button>
                {value ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground"
                        title={t('dashboard.iconPicker.clear', 'Clear icon')}
                        onClick={() => onChange('')}
                    >
                        <X className="size-4" />
                    </Button>
                ) : null}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>
                            {t('dashboard.iconPicker.title', 'Choose an icon')}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Set tabs, only when the picker offers more than one. */}
                    {sets.length > 1 ? (
                        <div className="flex flex-wrap gap-1">
                            {sets.map((set) => (
                                <Button
                                    key={set}
                                    type="button"
                                    size="sm"
                                    variant={set === activeSet ? 'secondary' : 'ghost'}
                                    onClick={() => reset({ set })}
                                >
                                    {setLabel(t, set)}
                                </Button>
                            ))}
                        </div>
                    ) : null}

                    <Input
                        autoFocus
                        value={search}
                        onChange={(e) => reset({ search: e.target.value })}
                        placeholder={t(
                            'dashboard.iconPicker.search',
                            'Search icons…',
                        )}
                    />

                    {categories.length > 0 ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                            <button
                                type="button"
                                onClick={() => reset({ category: null })}
                                className={
                                    !category ? iconCatActive : iconCatIdle
                                }
                            >
                                {t('dashboard.iconPicker.all', 'All')}
                            </button>
                            {categories.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => reset({ category: name })}
                                    className={
                                        category === name
                                            ? iconCatActive
                                            : iconCatIdle
                                    }
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    ) : null}

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {heroRequested && !catalogReady && !catalog ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                {t(
                                    'dashboard.iconPicker.loading',
                                    'Loading icons…',
                                )}
                            </p>
                        ) : shown.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                {t(
                                    'dashboard.iconPicker.empty',
                                    'No icons match.',
                                )}
                            </p>
                        ) : (
                            <div className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10">
                                {shown.map((tile) => {
                                    const selected = tile.key === value;
                                    return (
                                        <button
                                            key={tile.key}
                                            type="button"
                                            title={tile.label}
                                            onClick={() => pick(tile.key)}
                                            className={`flex aspect-square items-center justify-center rounded-lg border transition ${
                                                selected
                                                    ? 'border-brand bg-brand-soft-strong text-brand-ink dark:bg-brand/15'
                                                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            {createElement(
                                                resolveIcon(tile.key),
                                                {
                                                    className: 'size-5',
                                                    'aria-hidden': true,
                                                },
                                            )}
                                            <span className="sr-only">
                                                {tile.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {tiles.length > shown.length ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => setLimit((n) => n + PAGE * 2)}
                            >
                                {t(
                                    'dashboard.iconPicker.showMore',
                                    'Show more ({{count}} left)',
                                    { count: tiles.length - shown.length },
                                )}
                            </Button>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

const iconCatActive =
    'rounded-full bg-brand-soft-strong px-2.5 py-1 font-medium text-brand-ink dark:bg-brand/15';
const iconCatIdle =
    'rounded-full px-2.5 py-1 text-muted-foreground transition hover:text-foreground';

function setLabel(
    t: (key: string, fallback: string) => string,
    set: IconSet,
): string {
    switch (set) {
        case 'hero-outline':
            return t('dashboard.iconPicker.sets.outline', 'Heroicons Outline');
        case 'hero-solid':
            return t('dashboard.iconPicker.sets.solid', 'Heroicons Solid');
        case 'social':
            return t('dashboard.iconPicker.sets.social', 'Social brands');
    }
}
