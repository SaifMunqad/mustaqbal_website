import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ChevronDown, ExternalLink, Quote as QuoteIcon } from 'lucide-react';

import ArticleBody from '@/components/editor/article-body';
import ContactInfoPanel from '@/components/school/contact/contact-info-panel';
import ContactMessageForm from '@/components/school/contact/contact-message-form';
import ContactSuccessCard from '@/components/school/contact/contact-success-card';
import Reveal from '@/components/ui/reveal';
import { gridCols, masonryCols } from '@/lib/grid-cols';
import { resolveIcon } from '@/lib/icon-map';
import type { BlockListRow, RenderBlock } from '@/components/home/page-block';
import type { SharedData } from '@/types';

/**
 * Presentational renderers for the newer page-builder blocks. They all read the
 * shared generic payload produced by `PageSections::genericPayload()` — localized
 * `text`, the presentation `config`/columns, and the ordered `list` rows — so the
 * catalog can grow without new bespoke server wiring: a new type just maps to one
 * of these components.
 */

type BlockProps = { block: RenderBlock };

const rows = (b: RenderBlock): BlockListRow[] => b.list ?? [];
const text = (b: RenderBlock) => ({
    heading: b.text?.heading ?? '',
    body: b.text?.body ?? '',
    cta_label: b.text?.cta_label ?? '',
});
const cfgStr = (b: RenderBlock, key: string): string =>
    String(((b.config ?? {}) as Record<string, unknown>)[key] ?? '');

/**
 * Grid/list blocks read their track count from the block, falling back to the
 * count their renderer was designed with.
 */
const gridColsFor = (block: RenderBlock, fallback: number): string =>
    gridCols(block.columns, fallback);

const masonryColsFor = (block: RenderBlock, fallback: number): string =>
    masonryCols(block.columns, fallback);

const bandTones: Record<string, string> = {
    default: 'from-blue-600 to-sky-500',
    blue: 'from-blue-600 to-sky-500',
    green: 'from-emerald-600 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-rose-600 to-red-500',
};

function BlockHeading({
    heading,
    body,
}: {
    heading: string;
    body?: string;
}) {
    if (!heading && !body) return null;
    return (
        <header className="mb-6 text-center">
            {heading ? (
                <h2 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                    {heading}
                </h2>
            ) : null}
            {body ? (
                <p className="mx-auto mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
                    {body}
                </p>
            ) : null}
        </header>
    );
}

/** Testimonials / team — people cards with avatar, role and copy. */
export function ListGrid({ block }: BlockProps) {
    const items = rows(block).filter((r) => r.title || r.description);
    const { heading, body } = text(block);
    if (items.length === 0) return null;

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <div className={`grid gap-5 ${gridColsFor(block, 3)}`}>
                {items.map((item, i) => (
                    <Reveal key={`${item.title}-${i}`} delay={i * 50} className="h-full">
                        <article className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-900">
                            <div className="flex items-center gap-3">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="size-12 rounded-full object-cover"
                                    />
                                ) : null}
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {item.title}
                                    </p>
                                    {item.value ? (
                                        <p className="text-sm text-muted-foreground">
                                            {item.value}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {item.description}
                            </p>
                        </article>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

/** Partners / logos — a quiet, wrapping strip of grayscale marks. */
export function Logos({ block }: BlockProps) {
    const items = rows(block).filter((r) => r.image || r.title);
    const { heading, body } = text(block);
    if (items.length === 0) return null;

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
                {items.map((item, i) =>
                    item.image ? (
                        <Link
                            key={`${item.title}-${i}`}
                            href={item.url || '/'}
                            className="opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                className="max-h-12 w-auto"
                            />
                        </Link>
                    ) : (
                        <span
                            key={`${item.title}-${i}`}
                            className="text-lg font-semibold text-slate-500 dark:text-slate-400"
                        >
                            {item.title}
                        </span>
                    ),
                )}
            </div>
        </section>
    );
}

/** Gallery — responsive image grid with optional captions. */
export function Gallery({ block }: BlockProps) {
    const items = rows(block).filter((r) => r.image);
    const { heading, body } = text(block);
    if (items.length === 0) return null;

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <div className={`${masonryColsFor(block, 4)} gap-4 [&>*]:mb-4`}>
                {items.map((item, i) => (
                    <figure
                        key={i}
                        className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full object-cover"
                        />
                        {item.title ? (
                            <figcaption className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                                {item.title}
                            </figcaption>
                        ) : null}
                    </figure>
                ))}
            </div>
        </section>
    );
}

/** FAQ — accessible disclosure list (details/summary, no JS state). */
export function Faq({ block }: BlockProps) {
    const items = rows(block).filter((r) => r.title);
    const { heading, body } = text(block);
    if (items.length === 0) return null;

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
                {items.map((item, i) => (
                    <details key={i} className="group px-5 py-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-900 dark:text-white">
                            {item.title}
                            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                        </summary>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {item.description}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    );
}

/** Social links — labeled icon buttons. */
export function SocialLinks({ block }: BlockProps) {
    const items = rows(block).filter((r) => r.url);
    const { heading } = text(block);
    if (items.length === 0) return null;

    return (
        <section className="space-y-4">
            {heading ? (
                <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white">
                    {heading}
                </h2>
            ) : null}
            <div className="flex flex-wrap justify-center gap-3">
                {items.map((item, i) => (
                    <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:text-slate-200"
                    >
                        {item.image ? (
                            <img src={item.image} alt="" className="size-4" />
                        ) : (
                            <ExternalLink className="size-4" />
                        )}
                        {item.title}
                    </a>
                ))}
            </div>
        </section>
    );
}

/** Contact — labeled info rows with optional embedded map. */
export function Contact({ block }: BlockProps) {
    const items = rows(block).filter((r) => r.title || r.value);
    const { heading, body } = text(block);
    const embed = cfgStr(block, 'map_embed_url');
    if (items.length === 0 && !heading && !body) return null;

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-gray-900">
            <BlockHeading heading={heading} body={body} />
            <div className="grid gap-6 md:grid-cols-2">
                <ul className="space-y-3">
                    {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="mt-0.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {item.title}
                            </span>
                            {item.url ? (
                                <a
                                    href={item.url}
                                    className="text-sm text-slate-700 underline dark:text-slate-200"
                                >
                                    {item.value}
                                </a>
                            ) : (
                                <span className="text-sm text-slate-700 dark:text-slate-200">
                                    {item.value}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
                {embed ? (
                    <iframe
                        title="map"
                        src={embed}
                        className="h-64 w-full rounded-xl border border-border"
                        loading="lazy"
                    />
                ) : null}
            </div>
        </section>
    );
}

/**
 * Contact form — the real inquiry form, self-contained so it can be placed on
 * any page (Contact, Home, About). The submitted state lives here, so the
 * success card replaces only this block instead of the whole page.
 */
export function ContactForm({ block }: BlockProps) {
    const [submitted, setSubmitted] = useState(false);
    const { heading, body } = text(block);

    if (submitted) {
        return <ContactSuccessCard onSendAnother={() => setSubmitted(false)} />;
    }

    return (
        <ContactMessageForm
            title={heading || undefined}
            description={body || undefined}
            onSuccess={() => setSubmitted(true)}
        />
    );
}

/**
 * Contact details — the Site Settings contact column (phones, email, address
 * and social profiles), resolved live so there is exactly one place to edit
 * them. Never duplicates those values into authored list rows.
 */
export function ContactDetails({ block }: BlockProps) {
    const { site } = usePage<SharedData>().props;
    const { heading, body } = text(block);

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <ContactInfoPanel
                contact={site?.contact ?? {}}
                social={site?.social ?? {}}
            />
        </section>
    );
}

/** Call to action band — heading/body + button on a tinted gradient. */
export function Cta({ block }: BlockProps) {
    const { heading, body, cta_label } = text(block);
    const tone = bandTones[block.tone ?? 'default'] ?? bandTones.default;
    if (!heading && !body) return null;

    return (
        <section
            className={`rounded-3xl bg-gradient-to-r ${tone} px-8 py-12 text-center text-white shadow-md`}
        >
            {heading ? (
                <h2 className="text-2xl font-extrabold md:text-3xl">{heading}</h2>
            ) : null}
            {body ? <p className="mx-auto mt-3 max-w-2xl opacity-90">{body}</p> : null}
            {block.cta_url && cta_label ? (
                <Link
                    href={block.cta_url}
                    className="mt-6 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100"
                >
                    {cta_label}
                </Link>
            ) : null}
        </section>
    );
}

/** Pull quote — large centered quote with attribution. */
export function Quote({ block }: BlockProps) {
    const { heading, body } = text(block);
    if (!body && !heading) return null;

    return (
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-gray-900">
            <QuoteIcon className="mx-auto size-8 text-blue-500" />
            {body ? (
                <p className="mt-4 text-xl font-medium leading-relaxed text-slate-800 italic dark:text-slate-100">
                    {body}
                </p>
            ) : null}
            {heading ? (
                <cite className="mt-4 block text-sm font-semibold text-slate-500 not-italic dark:text-slate-400">
                    — {heading}
                </cite>
            ) : null}
        </section>
    );
}

/** Media + text — image beside a heading/body with an optional button. */
export function MediaText({ block }: BlockProps) {
    const { heading, body, cta_label } = text(block);
    if (!block.image_path && !heading && !body) return null;

    return (
        <section className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 dark:border-slate-800 dark:bg-gray-900">
            {block.image_path ? (
                <img
                    src={block.image_path}
                    alt={heading}
                    className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
            ) : null}
            <div className={block.image_path ? '' : 'md:col-span-2'}>
                {heading ? (
                    <h2 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                        {heading}
                    </h2>
                ) : null}
                {body ? (
                    <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
                        {body}
                    </p>
                ) : null}
                {block.cta_url && cta_label ? (
                    <Link
                        href={block.cta_url}
                        className="mt-6 inline-block rounded-xl border-2 border-sky-600 px-6 py-2.5 text-sm font-bold text-sky-800 transition hover:bg-sky-600 hover:text-white dark:border-sky-400 dark:text-sky-300"
                    >
                        {cta_label}
                    </Link>
                ) : null}
            </div>
        </section>
    );
}

/** Video embed — responsive 16:9 iframe from config.video_url. */
export function VideoEmbed({ block }: BlockProps) {
    const { heading, body } = text(block);
    const src = cfgStr(block, 'video_url');
    if (!src) return null;

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <div className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
                <iframe
                    title={heading || 'video'}
                    src={src}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </section>
    );
}

/** Map — embedded iframe from config (embed URL or lat/lng). */
export function MapBlock({ block }: BlockProps) {
    const { site } = usePage<SharedData>().props;
    const { heading, body } = text(block);
    let embed = cfgStr(block, 'map_embed_url');
    const lat = cfgStr(block, 'map_latitude');
    const lng = cfgStr(block, 'map_longitude');
    if (!embed && lat && lng) {
        embed = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }
    // A bare Map block falls back to the location configured in Site Settings,
    // so it works out of the box (e.g. on the Contact page).
    if (!embed) {
        embed = site?.contact?.map_embed_url ?? '';
    }
    if (!embed) return null;

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <iframe
                title="map"
                src={embed}
                className="h-96 w-full rounded-3xl border border-slate-200 shadow-sm dark:border-slate-800"
                loading="lazy"
            />
        </section>
    );
}

/** Newsletter — heading/body + email capture (presentational). */
export function Newsletter({ block }: BlockProps) {
    const { heading, body, cta_label } = text(block);
    if (!heading && !body) return null;

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-gray-900">
            {heading ? (
                <h2 className="text-xl font-bold text-slate-900 md:text-2xl dark:text-white">
                    {heading}
                </h2>
            ) : null}
            {body ? (
                <p className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-300">
                    {body}
                </p>
            ) : null}
            <form
                className="mx-auto mt-5 flex max-w-md items-center gap-2"
                onSubmit={(e) => e.preventDefault()}
            >
                <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm"
                />
                <button
                    type="submit"
                    className="h-11 shrink-0 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                    {cta_label || 'Subscribe'}
                </button>
            </form>
        </section>
    );
}

/** Countdown — live timer to config.end_date. */
export function CountdownBlock({ block }: BlockProps) {
    const { heading, body } = text(block);
    const end = cfgStr(block, 'end_date');
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!end) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [end]);

    if (!end) return null;

    const diff = Math.max(0, new Date(end).getTime() - now);
    const units = [
        { label: 'days', value: Math.floor(diff / 86400000) },
        { label: 'hours', value: Math.floor((diff % 86400000) / 3600000) },
        { label: 'mins', value: Math.floor((diff % 3600000) / 60000) },
        { label: 'secs', value: Math.floor((diff % 60000) / 1000) },
    ];

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-gray-900">
            {heading ? (
                <h2 className="text-xl font-bold text-slate-900 md:text-2xl dark:text-white">
                    {heading}
                </h2>
            ) : null}
            {body ? (
                <p className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-300">
                    {body}
                </p>
            ) : null}
            <div className="mt-6 flex justify-center gap-4">
                {units.map((u) => (
                    <div key={u.label} className="min-w-16">
                        <div className="text-3xl font-extrabold text-blue-600 tabular-nums md:text-4xl dark:text-blue-400">
                            {String(u.value).padStart(2, '0')}
                        </div>
                        <div className="text-xs tracking-wide text-slate-500 uppercase">
                            {u.label}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

/** Stat cards — a richer, carded variant of the quick-stats bar. */
export function StatsCards({ block }: BlockProps) {
    const items = rows(block).filter((r) => r.value || r.title);
    const { heading, body } = text(block);
    if (items.length === 0) return null;

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <div className={`grid gap-4 ${gridColsFor(block, 4)}`}>
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-gray-900"
                    >
                        <div className="text-3xl font-extrabold text-blue-600 md:text-4xl dark:text-blue-400">
                            {item.value}
                        </div>
                        <div className="mt-1 text-sm font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                            {item.title}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

/**
 * Icon cards — list rows rendered as icon + title + description tiles. This is
 * the generic home for About-style “values” (and any other icon-led grid),
 * with an optional admin-authored heading instead of a built-in one.
 */
export function IconCards({ block }: BlockProps) {
    const items = rows(block).filter((r) => r.title || r.description);
    const { heading, body } = text(block);
    if (items.length === 0) return null;

    const accents = [
        'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
        'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
        'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
        'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
        'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
        'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
    ];

    return (
        <section className="space-y-6">
            <BlockHeading heading={heading} body={body} />
            <div className={`grid gap-5 ${gridColsFor(block, 3)}`}>
                {items.map((item, index) => {
                    const Icon = resolveIcon(item.icon);

                    return (
                        <Reveal
                            key={`${item.title}-${index}`}
                            delay={index * 50}
                            className="h-full"
                        >
                            <article className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-900">
                                <div
                                    className={`flex size-12 items-center justify-center rounded-xl ${accents[index % accents.length]}`}
                                >
                                    <Icon className="size-6" aria-hidden />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {item.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    {item.description}
                                </p>
                            </article>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
}

/**
 * Rich text — server-sanitized HTML authored with the Tiptap editor. Used for
 * the About story and any other narrative block.
 */
export function RichTextBlock({ block }: BlockProps) {
    const body = block.text?.body ?? '';
    const heading = block.text?.heading ?? '';

    if (!body && !heading) return null;

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10 dark:border-slate-800 dark:bg-gray-900">
            {heading ? (
                <h2 className="mb-6 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                    {heading}
                </h2>
            ) : null}
            <ArticleBody
                body={body}
                className="text-slate-700 dark:text-slate-300"
            />
        </section>
    );
}
