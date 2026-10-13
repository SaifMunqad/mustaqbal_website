import { Link } from '@inertiajs/react';
import HomeCardItem, { shapeForIndex, type HomeCard } from './home-card-item';

export type { HomeCard };

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
    default: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    blue: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    green: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    amber: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    red: 'from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
};

function CardsSection({ section }: { section: HomeSection }) {
    return (
        <section className="space-y-4">
            {section.title ? (
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {section.title}
                </h2>
            ) : null}
            <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
                {(section.items ?? []).map((card, index) => (
                    <HomeCardItem
                        key={card.id}
                        card={card}
                        shapeClass={shapeForIndex(index)}
                    />
                ))}
            </div>
        </section>
    );
}

function BannerSection({ section }: { section: HomeSection }) {
    const config = section.config ?? {};
    const tone = toneStyles[config.tone ?? 'default'] ?? toneStyles.default;

    return (
        <section
            className={`relative min-h-[380px] overflow-hidden rounded-3xl bg-gradient-to-r ${tone} p-6 shadow-md md:min-h-[460px] md:p-10`}
        >
            {/* Full-bleed background image */}
            {config.image_url ? (
                <img
                    src={

                        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={config.heading ?? ''}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : null}

            {/* Gradient overlay to ensure text contrast over any background image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 dark:from-black/90 dark:via-black/50" />

            {/* Bottom-anchored content */}
            <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-end">
                {config.heading ? (
                    <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl">
                        {config.heading}
                    </h2>
                ) : null}

                {config.body ? (
                    <p className="mt-3 max-w-2xl text-base text-slate-200 md:text-lg">
                        {config.body}
                    </p>
                ) : null}

                {config.cta_label && config.cta_url ? (
                    <div className="mt-6">
                        <Link
                            href={config.cta_url}
                            className="inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none"
                        >
                            {config.cta_label}
                        </Link>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

function AnnouncementSection({ section }: { section: HomeSection }) {
    const config = section.config ?? {};

    // Customer-facing announcements use a single blue accent regardless of the
    // stored tone, matching the site's simplified blue palette.
    const accent = 'border-blue-300 bg-blue-50 dark:bg-blue-950/40';

    return (
        <section className={`rounded-2xl border p-5 ${accent}`}>
            {config.heading ? (
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {config.heading}
                </h3>
            ) : null}
            {config.body ? (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    {config.body}
                </p>
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

export default function HomeSections({
    sections,
}: {
    sections: HomeSection[];
}) {
    return (
        <div className="space-y-8">
            {sections.map((section) => {
                if (section.variant === 'banner') {
                    return <BannerSection key={section.id} section={section} />;
                }
                if (section.variant === 'announcement') {
                    return (
                        <AnnouncementSection
                            key={section.id}
                            section={section}
                        />
                    );
                }
                return <CardsSection key={section.id} section={section} />;
            })}
        </div>
    );
}
