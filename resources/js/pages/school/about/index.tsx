import { Head, Link, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    Eye,
    GraduationCap,
    HeartHandshake,
    Quote,
    ShieldCheck,
    Sparkles,
    Target,
    Users,
    type LucideIcon,
} from 'lucide-react';
import MainLayout from '@/layouts/app/main-layout';
import ArticleBody from '@/components/editor/article-body';
import { cn } from '@/lib/utils';
import type { SiteSettings } from '@/types';

interface Stat {
    value: string;
    label: string;
}

interface ValueItem {
    icon?: string;
    title: string;
    text?: string;
}

interface Highlight {
    title: string;
    text?: string;
}

interface LeadershipMessage {
    text?: string;
    author_name?: string;
    author_role?: string;
    author_image?: string;
}

interface FaqItem {
    question?: string;
    answer?: string;
}

interface AboutContent {
    intro?: string;
    body?: string;
    mission?: string;
    vision?: string;
    manager_message?: string;
    stats?: Stat[];
    values?: ValueItem[];
    highlights?: Highlight[];
    goals?: string[];
    main_points?: string[];
    message?: LeadershipMessage;
    faq?: FaqItem[];
    video_embed?: string;
}

interface AboutPageData {
    title: string;
    hero_image?: string;
    content?: AboutContent;
}

// Map the seeded `icon` keys to Lucide components; unknown keys fall back to a
// friendly default so a tile always renders an icon.
const VALUE_ICONS: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    sparkles: Sparkles,
    'heart-handshake': HeartHandshake,
    users: Users,
    'shield-check': ShieldCheck,
    'graduation-cap': GraduationCap,
};

// Rotating accent tints keep adjacent tiles visually varied rather than uniform.
const ACCENTS = [
    'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
];

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
    return (
        <div className="mx-auto max-w-2xl text-center">
            {eyebrow ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <span className="size-1.5 rounded-full bg-indigo-500" />
                    {eyebrow}
                </div>
            ) : null}
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">{title}</h2>
            {subtitle ? (
                <p className="mt-2 text-sm text-slate-600 md:text-base dark:text-slate-300">{subtitle}</p>
            ) : null}
        </div>
    );
}

function Hero({ title, intro, image, tagline, enrollLabel, contactLabel }: { title: string; intro?: string; image?: string | null; tagline?: string; enrollLabel: string; contactLabel: string }) {
    return (
        <section className="relative overflow-hidden rounded-3xl shadow-sm">
            {image ? (
                <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
                <div className="absolute inset-0 bg-blue-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/70 to-slate-900/40" />

            <div className="relative flex flex-col items-start gap-5 px-6 py-16 md:px-12 md:py-24">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/25 backdrop-blur">
                    <Sparkles className="size-3.5" aria-hidden />
                    {tagline}
                </div>
                <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white md:text-5xl">{title}</h1>
                {intro ? <p className="max-w-2xl text-base text-slate-100/90 md:text-lg">{intro}</p> : null}
                <div className="mt-2 flex flex-wrap gap-3">
                    <Link
                        href="/school/enroll"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                    >
                        {enrollLabel}
                        <ArrowRight className="size-4" aria-hidden />
                    </Link>
                    <Link
                        href="/school/contact"
                        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
                    >
                        {contactLabel}
                    </Link>
                </div>
            </div>
        </section>
    );
}

function StatsBand({ stats }: { stats: Stat[] }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-gray-900">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={`${stat.label}-${index}`} className="text-center">
                        <div className="text-3xl font-extrabold text-indigo-600 md:text-4xl dark:text-indigo-400">
                            {stat.value}
                        </div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{stat.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function StorySection({ body }: { body: string }) {
    return (
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-10 dark:bg-gray-900">
            <ArticleBody body={body} className="text-slate-700 dark:text-slate-300" />
        </section>
    );
}

function MissionVision({ mission, vision }: { mission?: string; vision?: string }) {
    const { t } = useTranslation();

    if (!mission && !vision) {
        return null;
    }

    const cards = [
        mission
            ? { key: 'mission', Icon: Target, accent: ACCENTS[0], title: t('about.missionTitle'), text: mission }
            : null,
        vision
            ? { key: 'vision', Icon: Eye, accent: ACCENTS[1], title: t('about.visionTitle'), text: vision }
            : null,
    ].filter(Boolean) as { key: string; Icon: LucideIcon; accent: string; title: string; text: string }[];

    return (
        <section className="grid gap-5 md:grid-cols-2">
            {cards.map(({ key, Icon, accent, title, text }) => (
                <div
                    key={key}
                    className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-gray-900"
                >
                    <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', accent)}>
                        <Icon className="size-6" aria-hidden />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">{text}</p>
                    </div>
                </div>
            ))}
        </section>
    );
}

function ValuesSection({ values }: { values: ValueItem[] }) {
    const { t } = useTranslation();

    return (
        <section className="space-y-8">
            <SectionHeading eyebrow={t('about.valuesEyebrow')} title={t('about.valuesTitle')} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {values.map((value, index) => {
                    const Icon = VALUE_ICONS[value.icon ?? ''] ?? Sparkles;
                    return (
                        <article
                            key={`${value.title}-${index}`}
                            className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-gray-900"
                        >
                            <div className={cn('flex size-12 items-center justify-center rounded-xl', ACCENTS[index % ACCENTS.length])}>
                                <Icon className="size-6" aria-hidden />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{value.title}</h3>
                            {value.text ? <p className="text-sm text-slate-600 dark:text-slate-300">{value.text}</p> : null}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function HighlightsSection({ highlights }: { highlights: Highlight[] }) {
    const { t } = useTranslation();

    return (
        <section className="space-y-8">
            <SectionHeading eyebrow={t('about.highlightsEyebrow')} title={t('about.highlightsTitle')} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((item, index) => (
                    <div
                        key={`${item.title}-${index}`}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-gray-900"
                    >
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden />
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                            {item.text ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.text}</p> : null}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function LeadershipMessage({ message }: { message: LeadershipMessage }) {
    const image = message.author_image;
    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-blue-50 shadow-sm dark:border-slate-800 dark:bg-blue-950">
            <div className="flex flex-col items-center gap-6 p-6 md:flex-row md:p-10">
                {image ? (
                    <img
                        src={image}
                        alt={message.author_name ?? ''}
                        className="size-28 shrink-0 rounded-2xl object-cover shadow-md"
                    />
                ) : (
                    <div className="flex size-28 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                        <Quote className="size-10" aria-hidden />
                    </div>
                )}
                <div className="text-center md:text-start">
                    <Quote className="mx-auto mb-2 size-6 text-indigo-400 md:mx-0" aria-hidden />
                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">{message.text}</p>
                    {message.author_name ? (
                        <div className="mt-4 font-semibold text-slate-900 dark:text-white">{message.author_name}</div>
                    ) : null}
                    {message.author_role ? (
                        <div className="text-sm text-slate-500 dark:text-slate-400">{message.author_role}</div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}

/**
 * Turn an admin-pasted value into a safe iframe `src`. Accepts either a full
 * `<iframe>` embed code (we lift out its `src`) or a bare share URL, normalised
 * to an embeddable form for the common providers. Anything that is not a plain
 * http(s) URL is ignored, so the section hides itself rather than break.
 */
function resolveVideoSrc(embed?: string): string | null {
    const value = embed?.trim();
    if (!value) {
        return null;
    }

    const iframeSrc = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1];
    const candidate = (iframeSrc ?? value).trim();

    if (!/^https?:\/\//i.test(candidate)) {
        return null;
    }

    return normalizeEmbedUrl(candidate);
}

function normalizeEmbedUrl(url: string): string {
    try {
        const parsed = new URL(url);

        // Convert YouTube watch/share links to their /embed/<id> form.
        if (parsed.hostname.includes('youtube.com')) {
            const id = parsed.searchParams.get('v');
            if (id) {
                return `https://www.youtube.com/embed/${id}`;
            }
        }
        if (parsed.hostname === 'youtu.be') {
            const id = parsed.pathname.slice(1);
            if (id) {
                return `https://www.youtube.com/embed/${id}`;
            }
        }

        return url;
    } catch {
        return url;
    }
}

function VideoSection({ embed, title }: { embed: string; title?: string }) {
    const { t } = useTranslation();
    const src = resolveVideoSrc(embed);

    if (!src) {
        return null;
    }

    return (
        <section className="space-y-8">
            <SectionHeading eyebrow={t('about.videoEyebrow')} title={t('about.videoTitle')} />
            <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-gray-900">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                    <iframe
                        src={src}
                        title={title ? `${title} — ${t('about.videoTitle')}` : t('about.videoTitle')}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            </div>
        </section>
    );
}

function GoalsPointsSection({ goals, mainPoints }: { goals: string[]; mainPoints: string[] }) {
    const { t } = useTranslation();
    return (
        <section className="grid gap-5 md:grid-cols-2">
            {goals.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-gray-900">
                    <div className="flex items-center gap-2">
                        <Target className="size-5 text-indigo-500" aria-hidden />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('about.goals')}</h2>
                    </div>
                    <ul className="mt-4 space-y-3">
                        {goals.map((goal) => (
                            <li key={goal} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden />
                                <span>{goal}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {mainPoints.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-gray-900">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="size-5 text-indigo-500" aria-hidden />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('about.mainPoints')}</h2>
                    </div>
                    <ul className="mt-4 space-y-3">
                        {mainPoints.map((point) => (
                            <li key={point} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </section>
    );
}

function FaqSection({ faqs }: { faqs: FaqItem[] }) {
    const { t } = useTranslation();

    return (
        <section className="space-y-8">
            <SectionHeading eyebrow={t('about.faqEyebrow')} title={t('about.faqTitle')} />
            <div className="mx-auto max-w-3xl space-y-3">
                {faqs.map((faq, index) => (
                    <details
                        key={`${faq.question}-${index}`}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-gray-900"
                    >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white">
                            {faq.question}
                            <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden />
                        </summary>
                        {faq.answer ? (
                            <p className="mt-3 text-slate-600 dark:text-slate-300">{faq.answer}</p>
                        ) : null}
                    </details>
                ))}
            </div>
        </section>
    );
}

function CtaBand() {
    const { t } = useTranslation();

    return (
        <section className="overflow-hidden rounded-3xl bg-blue-700 p-8 text-center shadow-md md:p-12">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{t('about.ctaTitle')}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-blue-100">{t('about.ctaText')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                    href="/school/enroll"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                    {t('about.ctaEnroll')}
                    <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                    href="/school/contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
                >
                    {t('about.ctaContact')}
                </Link>
            </div>
        </section>
    );
}

function SchoolAbout() {
    const { t } = useTranslation();
    const { page, site } = usePage<{ page: AboutPageData | null; site: SiteSettings }>().props;
    const content = page?.content ?? {};
    const title = page?.title ?? site?.brand_name ?? t('about.title');

    // Rich-text body authored from the dashboard is the main narrative.
    const body = content.body?.trim();

    // Fall back to the legacy `manager_message` field if no structured
    // leadership message has been seeded yet.
    const message =
        content.message?.text || content.manager_message
            ? {
                  text: content.message?.text ?? content.manager_message,
                  author_name: content.message?.author_name,
                  author_role: content.message?.author_role ?? t('about.managerMessage'),
                  author_image: content.message?.author_image,
              }
            : null;

    const stats = (content.stats ?? []).filter((stat) => stat.value || stat.label);
    const values = (content.values ?? []).filter((value) => value.title);
    const highlights = (content.highlights ?? []).filter((item) => item.title);
    const faq = (content.faq ?? []).filter((item) => item.question);
    const goals = content.goals ?? [];
    const mainPoints = content.main_points ?? [];
    const videoEmbed = content.video_embed?.trim();

    return (
        <div className="space-y-6 md:space-y-8">
            <Head title={title} />

            <Hero
                title={title}
                intro={content.intro ?? (body ? undefined : t('about.paragraph'))}
                image={page?.hero_image ?? site?.home?.hero_image ?? null}
                tagline={t('about.badge')}
                enrollLabel={t('about.heroEnroll')}
                contactLabel={t('about.heroContact')}
            />

            {stats.length ? <StatsBand stats={stats} /> : null}

            {body ? <StorySection body={body} /> : null}

            {videoEmbed ? <VideoSection embed={videoEmbed} title={title} /> : null}

            <MissionVision mission={content.mission} vision={content.vision} />

            {values.length ? <ValuesSection values={values} /> : null}

            {highlights.length ? <HighlightsSection highlights={highlights} /> : null}

            {message?.text ? <LeadershipMessage message={message} /> : null}

            {goals.length || mainPoints.length ? (
                <GoalsPointsSection goals={goals} mainPoints={mainPoints} />
            ) : null}

            {faq.length ? <FaqSection faqs={faq} /> : null}

            <CtaBand />
        </div>
    );
}

SchoolAbout.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolAbout;
