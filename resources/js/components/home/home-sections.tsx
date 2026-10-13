import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export interface HomeCard {
    id: number;
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    image?: string | null;
    url?: string | null;
    date?: string | null;
    dir?: string | null;
}

export interface HomeSectionConfig {
    heading?: string | null;
    body?: string | null;
    image_url?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    tone?: string;
}

export interface HomeSection {
    id: number;
    type: string;
    variant: 'cards' | 'banner' | 'announcement';
    title?: string | null;
    items?: HomeCard[];
    config?: HomeSectionConfig;
}

const toneStyles: Record<string, string> = {
    default: 'from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800',
    blue: 'from-blue-100 to-indigo-200 dark:from-blue-950 dark:to-indigo-900',
    green: 'from-emerald-100 to-teal-200 dark:from-emerald-950 dark:to-teal-900',
    amber: 'from-amber-100 to-orange-200 dark:from-amber-950 dark:to-orange-900',
    red: 'from-red-100 to-rose-200 dark:from-red-950 dark:to-rose-900',
};

function useDateFormatter() {
    const { i18n } = useTranslation();
    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;

    return (value?: string | null) => {
        if (!value) {
            return null;
        }
        try {
            return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                new Date(value),
            );
        } catch {
            return null;
        }
    };
}

function HomeCardItem({ card }: { card: HomeCard }) {
    const formatDate = useDateFormatter();
    const date = formatDate(card.date);
    const inner = (
        <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-gray-900">
            {card.image ? (
                <img
                    src={card.image}
                    alt={card.title}
                    className="h-36 w-full rounded-xl object-cover"
                />
            ) : (
                <div className="flex h-36 w-full items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl font-bold text-white">
                    {card.title.slice(0, 1)}
                </div>
            )}
            <div dir={card.dir ?? undefined} className={card.dir === 'rtl' ? 'text-right' : 'text-left'}>
                {card.subtitle ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        {card.subtitle}
                    </p>
                ) : null}
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{card.title}</p>
                {card.excerpt ? (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{card.excerpt}</p>
                ) : null}
                {date ? <p className="mt-3 text-xs text-slate-400">{date}</p> : null}
            </div>
        </div>
    );

    return card.url ? (
        <Link href={card.url} className="block h-full">
            {inner}
        </Link>
    ) : (
        inner
    );
}

function CardsSection({ section }: { section: HomeSection }) {
    return (
        <section className="space-y-4">
            {section.title ? (
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{section.title}</h2>
            ) : null}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {(section.items ?? []).map((card) => (
                    <HomeCardItem key={card.id} card={card} />
                ))}
            </div>
        </section>
    );
}

function BannerSection({ section }: { section: HomeSection }) {
    const config = section.config ?? {};
    const tone = toneStyles[config.tone ?? 'default'] ?? toneStyles.default;

    return (
        <section className={`rounded-3xl bg-gradient-to-r ${tone} p-6 shadow-md md:p-10`}>
            {config.image_url ? (
                <img
                    src={config.image_url}
                    alt={config.heading ?? ''}
                    className="mb-6 h-56 w-full rounded-2xl object-cover"
                />
            ) : null}
            {config.heading ? (
                <h2 className="text-2xl font-bold text-slate-900 md:text-4xl dark:text-white">
                    {config.heading}
                </h2>
            ) : null}
            {config.body ? (
                <p className="mt-3 max-w-3xl text-base text-slate-700 md:text-lg dark:text-slate-300">
                    {config.body}
                </p>
            ) : null}
            {config.cta_label && config.cta_url ? (
                <div className="mt-6">
                    <Link
                        href={config.cta_url}
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        {config.cta_label}
                    </Link>
                </div>
            ) : null}
        </section>
    );
}

function AnnouncementSection({ section }: { section: HomeSection }) {
    const config = section.config ?? {};
    const tone = config.tone ?? 'default';

    const accent =
        tone === 'red'
            ? 'border-red-300 bg-red-50 dark:bg-red-950/40'
            : tone === 'amber'
              ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40'
              : tone === 'green'
                ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-blue-300 bg-blue-50 dark:bg-blue-950/40';

    return (
        <section className={`rounded-2xl border p-5 ${accent}`}>
            {config.heading ? (
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{config.heading}</h3>
            ) : null}
            {config.body ? (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{config.body}</p>
            ) : null}
            {config.cta_label && config.cta_url ? (
                <Link
                    href={config.cta_url}
                    className="mt-3 inline-block text-sm font-semibold text-blue-700 underline dark:text-blue-300"
                >
                    {config.cta_label}
                </Link>
            ) : null}
        </section>
    );
}

export default function HomeSections({ sections }: { sections: HomeSection[] }) {
    return (
        <div className="space-y-8">
            {sections.map((section) => {
                if (section.variant === 'banner') {
                    return <BannerSection key={section.id} section={section} />;
                }
                if (section.variant === 'announcement') {
                    return <AnnouncementSection key={section.id} section={section} />;
                }
                return <CardsSection key={section.id} section={section} />;
            })}
        </div>
    );
}
