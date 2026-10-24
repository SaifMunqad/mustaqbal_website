import type { SiteSettings } from '@/types';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface HomeHeroProps {
    home: SiteSettings['home'];
    tagline?: string | null;
    /** Override the RTL layout (used by the visual editor so the preview follows
     *  the language being edited rather than the admin UI language). */
    rtl?: boolean;
}

export default function HomeHero({ home, tagline, rtl }: HomeHeroProps) {
    const { t, i18n } = useTranslation();
    const isRtl = rtl ?? (i18n.dir() === 'rtl' || i18n.language === 'ar');

    const title = home.title || t('home.title');
    const subtitle = home.subtitle || t('home.subtitle');
    const primaryLabel = home.cta_primary || t('home.ctaPrimary');
    const secondaryLabel = home.cta_secondary || t('home.ctaSecondary');

    // Direction & responsive mask:
    // - < lg (mobile & tablet): Fades bottom edge into text below
    // - lg+ (desktop): Fades horizontally towards adjacent text
    const maskClasses = isRtl
        ? '[mask-image:linear-gradient(to_top,transparent_0%,black_35%,black_100%)] [-webkit-mask-image:linear-gradient(to_top,transparent_0%,black_35%,black_100%)] lg:[mask-image:linear-gradient(to_left,transparent_0%,black_35%,black_100%)] lg:[-webkit-mask-image:linear-gradient(to_left,transparent_0%,black_35%,black_100%)]'
        : '[mask-image:linear-gradient(to_top,transparent_0%,black_35%,black_100%)] [-webkit-mask-image:linear-gradient(to_top,transparent_0%,black_35%,black_100%)] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)]';

    const heroImageSrc =
        home.hero_image ||
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80';

    return (
        <section
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-md dark:border-slate-800 dark:from-blue-900 dark:via-[#0a192f] dark:to-slate-950 ${
                isRtl
                    ? 'bg-gradient-to-t from-sky-100 via-blue-100/70 to-blue-700 lg:bg-gradient-to-l'
                    : 'bg-gradient-to-t from-sky-100 via-blue-100/70 to-blue-700 lg:bg-gradient-to-r'
            }`}
        >
            {/* Ambient glow radiating from top-start */}
            <div
                className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent dark:from-sky-400/20 ${
                    isRtl
                        ? 'from-blue-300/50 [background-position:top_right]'
                        : 'from-blue-300/50 [background-position:top_left]'
                }`}
            />

            <div className="grid min-h-[460px] items-stretch gap-0 lg:grid-cols-12 lg:gap-6">
                {/*
                  Image container:
                  - < md:  order-first, full width, 1:1 square
                  - md:    order-first, full width, 4:3 landscape (still on top)
                  - lg+:   order-last, 6 cols side-by-side, fills full height
                */}
                <div className="relative order-first aspect-square w-full md:aspect-[4/3] lg:order-last lg:col-span-6 lg:aspect-auto lg:h-full lg:self-stretch">
                    <div
                        className={`relative h-full w-full overflow-hidden ${maskClasses}`}
                    >
                        <img
                            src={heroImageSrc}
                            alt={title}
                            className="h-full w-full object-cover object-center"
                        />
                    </div>
                </div>

                {/* Text Content Column */}
                <div
                    className={`relative z-10 flex flex-col justify-between px-8 py-10 md:py-12 lg:col-span-6 lg:h-full lg:py-14 ${
                        isRtl
                            ? 'items-start text-right lg:pr-12 lg:pl-4'
                            : 'items-start text-left lg:pr-4 lg:pl-12'
                    }`}
                >
                    {/* Top Start: Tagline / Blue Badge */}
                    {tagline ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-bold tracking-wider text-sky-100 uppercase shadow-sm">
                            {tagline}
                        </span>
                    ) : null}

                    {/* Start Bottom: Title, Subtitle, and CTAs */}
                    <div className="mt-8 flex flex-col items-start lg:mt-auto">
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
                            {title}
                        </h1>

                        <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-700 sm:text-lg dark:text-slate-300">
                            {subtitle}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3.5">
                            <Link
                                href={home.cta_primary_url || '/school/programs'}
                                className="rounded-xl border-2 border-sky-600 bg-transparent px-6 py-2.5 text-sm font-bold text-sky-800 shadow-sm transition-all hover:bg-sky-600 hover:text-white dark:border-sky-400 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-white"
                            >
                                {primaryLabel}
                            </Link>
                            <Link
                                href={home.cta_secondary_url || '/school/contact'}
                                className="rounded-xl border border-slate-300/80 bg-white/80 px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {secondaryLabel}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
