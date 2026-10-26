/**
 * One-off generator for resources/js/lib/hero-catalog.ts.
 *
 * Enumerates every icon shipped by the installed @heroicons/react package
 * (24/outline + 24/solid), assigns a presentation category from keyword rules,
 * and emits the catalog module with its star imports. Re-run after a heroicons
 * upgrade to pick up new glyphs. Delete after use.
 */
const fs = require('fs');
const path = require('path');

const PKG = path.resolve(
    __dirname,
    'node_modules/@heroicons/react',
);

const kebab = (name) =>
    name
        .replace(/Icon$/, '')
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Za-z])(\d)/g, '$1-$2')
        .toLowerCase();

const list = (sub) =>
    fs
        .readdirSync(path.join(PKG, sub))
        .filter((f) => f.endsWith('.js') && f !== 'index.js' && f !== 'esm.js')
        .map((f) => f.replace(/\.js$/, ''))
        .sort();

const outline = list('24/outline');
const solid = list('24/solid');

// Ordered first-match keyword rules. A category claims an icon when any
// keyword is a whole dash-token of the kebab name. 'misc' is the fallback, so
// a missed name still shows up in the picker instead of vanishing.
const RULES = [
    ['Arrows', ['arrow', 'arrows']],
    ['School & work', ['academic', 'graduation', 'book', 'library', 'backpack', 'backspace', 'briefcase', 'beaker', 'calculator', 'puzzle', 'bulb', 'light']],
    ['Home', ['home', 'building', 'storefront', 'office']],
    ['People & faces', ['user', 'users', 'person', 'face', 'hand', 'thumb', 'identification', 'group']],
    ['Communication', ['mail', 'email', 'envelope', 'inbox', 'megaphone', 'paper-airplane', 'airplane', 'at', 'symbol', 'send', 'chat', 'bubble', 'share', 'phone', 'language', 'translate']],
    ['Money & finance', ['money', 'cash', 'banknote', 'banknotes', 'coin', 'wallet', 'pay', 'price', 'cost', 'budget', 'finance', 'invoice', 'percent', 'currency', 'dollar', 'credit', 'card', 'receipt', 'tag', 'scale']],
    ['Shopping', ['shop', 'cart', 'bag', 'store', 'product', 'package', 'ticket', 'gift', 'barcode', 'qr', 'gift-top']],
    ['Health', ['health', 'medical', 'heart', 'pill', 'medicine', 'first-aid', 'bandage', 'hospital', 'dental', 'tooth', 'virus', 'mask', 'therapy', 'fitness', 'run', 'walk', 'bike', 'activity', 'pulse', 'weight']],
    ['Weather & nature', ['sun', 'moon', 'cloud', 'rain', 'snow', 'fire', 'leaf', 'tree', 'mountain', 'water']],
    ['Events & awards', ['calendar', 'date', 'clock', 'time', 'hourglass', 'event', 'award', 'trophy', 'medal', 'crown', 'flag', 'balloon', 'confetti', 'cake', 'party', 'rocket', 'star']],
    ['Design', ['brush', 'palette', 'color', 'paint', 'swatch', 'dropper', 'gradient', 'theme', 'scissors', 'crop', 'pencil', 'highlight', 'eraser', 'sparkles']],
    ['Media', ['play', 'pause', 'stop', 'skip', 'next', 'previous', 'backward', 'forward', 'rewind', 'fast', 'film', 'photo', 'image', 'picture', 'music', 'musical', 'album', 'mic', 'microphone', 'radio', 'disc', 'record', 'gif', 'loop', 'repeat', 'shuffle', 'volume', 'audio', 'wave', 'speaker', 'video', 'camera', 'tv', 'film']],
    ['Tech & web', ['code', 'bracket', 'command', 'terminal', 'variable', 'function', 'rss', 'wifi', 'signal', 'globe', 'internet', 'server', 'cpu', 'chip', 'cube', 'rectangle', 'queue', 'circle-stack', 'stack']],
    ['Devices & power', ['device', 'phone', 'mobile', 'tablet', 'desktop', 'computer', 'laptop', 'monitor', 'keyboard', 'mouse', 'printer', 'battery', 'power', 'plug', 'bolt']],
    ['Settings & tools', ['settings', 'cog', 'wrench', 'tool', 'screwdriver', 'hammer', 'tune', 'slider', 'toggle', 'switch']],
    ['Security', ['lock', 'key', 'password', 'finger-print', 'fingerprint', 'shield', 'privacy', 'safe', 'identification']],
    ['Alerts & status', ['alert', 'bell', 'warning', 'exclamation', 'error', 'danger', 'question', 'information', 'info', 'check', 'badge', 'plus', 'minus', 'close', 'x-mark', 'x-circle', 'xmark', 'xcircle', 'divide', 'equals', 'no-symbol', 'lifebuoy', 'slash', 'bug']],
    ['Files & documents', ['document', 'doc', 'file', 'folder', 'archive', 'clipboard', 'newspaper', 'print', 'trash', 'paper', 'clip', 'list', 'numbered-list', 'bookmark', 'heading']],
    ['Text & writing', ['text', 'type', 'font', 'write', 'edit', 'bold', 'italic', 'underline', 'strikethrough', 'paragraph', 'content', 'caption', 'quote', 'link', 'hashtag', 'numbered', 'h-1', 'h-2', 'h-3']],
    ['Layout', ['layout', 'grid', 'column', 'row', 'frame', 'box', 'window', 'sidebar', 'panel', 'toolbar', 'navbar', 'layer', 'border', 'square', 'squares', 'view', 'columns']],
    ['Search & view', ['search', 'zoom', 'magnifying', 'eye', 'scan', 'viewfinder']],
    ['Charts & data', ['chart', 'presentation', 'table', 'data']],
    ['Sort & filter', ['sort', 'filter', 'funnel', 'adjustments', 'bars-arrow']],
    ['Navigation & menus', ['chevron', 'menu', 'ellipsis', 'bars', 'map', 'pin', 'truck', 'travel', 'location', 'address', 'globe', 'earth']],
    ['Misc', []],
];

// Picker display order (categories with no icons are skipped automatically).
const ORDER = [
    'School & work',
    'Home',
    'People & faces',
    'Communication',
    'Money & finance',
    'Shopping',
    'Health',
    'Weather & nature',
    'Events & awards',
    'Design',
    'Media',
    'Tech & web',
    'Devices & power',
    'Settings & tools',
    'Security',
    'Alerts & status',
    'Files & documents',
    'Text & writing',
    'Layout',
    'Search & view',
    'Charts & data',
    'Sort & filter',
    'Navigation & menus',
    'Arrows',
    'Misc',
];

const categoryOf = (key) => {
    const tokens = key.split('-');
    for (const [cat, keywords] of RULES) {
        if (keywords.some((kw) => tokens.includes(kw) || key === kw)) {
            return cat;
        }
    }
    return 'Misc';
};

const labelOf = (key) =>
    key
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
        // 'H 1' / 'Squares 2 X 2' read better compactly.
        .replace(/\bH (\d)\b/g, 'H$1');

if (outline.length !== solid.length) {
    console.warn(
        `warning: outline (${outline.length}) and solid (${solid.length}) sets differ`,
    );
}

const keys = [...new Set([...outline, ...solid])].sort();
const entries = keys.map((n) => {
    const key = kebab(n);
    return {
        key,
        label: labelOf(key),
        category: categoryOf(key),
        outline: n,
        solid: n,
    };
});

const counts = {};
for (const e of entries) counts[e.category] = (counts[e.category] ?? 0) + 1;
console.log('icons:', entries.length);
for (const cat of ORDER) if (counts[cat]) console.log(String(counts[cat]).padStart(4), cat);
const unmatched = entries.filter((e) => e.category === 'Misc').map((e) => e.key);
console.log('misc keys:', unmatched.join(' '));

// --- emit hero-catalog.ts ---------------------------------------------------

const hasOutline = new Set(outline.map(kebab));
const hasSolid = new Set(solid.map(kebab));

const rows = entries.map((e) =>
    `    { key: '${e.key}', label: '${e.label}', category: '${e.category}',` +
    ` o: ${hasOutline.has(e.key) ? 'Outline.' + e.outline : 'null'}, s: ${hasSolid.has(e.key) ? 'Solid.' + e.solid : 'null'} },`,
);

const file = `/**
 * Generated catalog of every Heroicon shipped by @heroicons/react (24/outline
 * and 24/solid), one row per glyph with its picker label and category.
 *
 * DO NOT EDIT BY HAND — regenerate with \`node generate-hero-catalog.cjs\` after
 * upgrading the heroicons package. The module registers its icons into the
 * shared resolver in \`icon-map\` when it loads; \`icon-map\`'s
 * \`loadIconCatalog()\` is the entry point that triggers that load (awaited once
 * at boot in \`app.tsx\` and when the builder opens its picker).
 */
import * as Outline from '@heroicons/react/24/outline';
import * as Solid from '@heroicons/react/24/solid';
import { registerHeroIcons, type HeroIconComponent } from './icon-map';

export interface HeroIconEntry {
    /** Kebab-case glyph name; the catalog key before its style prefix. */
    key: string;
    /** Human label shown in the picker grid. */
    label: string;
    /** Picker section the glyph belongs to. */
    category: string;
    o: HeroIconComponent | null;
    s: HeroIconComponent | null;
}

const HERO_ICON_ROWS = [
${rows.join('\n')}
];

export const HERO_ICONS: HeroIconEntry[] = HERO_ICON_ROWS as HeroIconEntry[];

/** Sorted, de-duplicated category names in picker order. */
export const HERO_ICON_CATEGORIES: string[] = [
    ...new Set(HERO_ICONS.map((entry) => entry.category)),
];

// Register the whole set with the resolver so every page can render selected
// glyphs; importing this module is what makes 'h:' keys resolvable.
registerHeroIcons(
    HERO_ICONS.reduce<Record<string, HeroIconComponent>>((acc, entry) => {
        if (entry.o) acc['h:' + entry.key] = entry.o as HeroIconComponent;
        if (entry.s) acc['solid:h:' + entry.key] = entry.s as HeroIconComponent;
        return acc;
    }, {}),
);
`;

fs.writeFileSync(
    path.resolve(__dirname, 'resources/js/lib/hero-catalog.ts'),
    file,
);
console.log('wrote resources/js/lib/hero-catalog.ts');
