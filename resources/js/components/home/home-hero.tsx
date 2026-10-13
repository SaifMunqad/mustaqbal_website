import type { SiteSettings } from '@/types';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface HomeHeroProps {
    home: SiteSettings['home'];
    tagline?: string | null;
}

export default function HomeHero({ home, tagline }: HomeHeroProps) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language === 'ar';

    const title = home.title || t('home.title');
    const subtitle = home.subtitle || t('home.subtitle');
    const primaryLabel = home.cta_primary || t('home.ctaPrimary');
    const secondaryLabel = home.cta_secondary || t('home.ctaSecondary');

    // Direction-aware and responsive mask:
    // Mobile (< lg): fades out at the bottom edge to blend into the text below
    // Desktop (lg+): fades horizontally towards the text side
    const maskClasses = isRtl
        ? '[mask-image:linear-gradient(to_top,transparent_0%,black_35%,black_100%)] [-webkit-mask-image:linear-gradient(to_top,transparent_0%,black_35%,black_100%)] lg:[mask-image:linear-gradient(to_left,transparent_0%,black_35%,black_100%)] lg:[-webkit-mask-image:linear-gradient(to_left,transparent_0%,black_35%,black_100%)]'
        : '[mask-image:linear-gradient(to_top,transparent_0%,black_35%,black_100%)] [-webkit-mask-image:linear-gradient(to_top,transparent_0%,black_35%,black_100%)] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)]';

    const heroImageSrc =
        home.hero_image ||
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80';

    return (
        <section
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-md dark:border-slate-800 dark:from-slate-950 dark:via-[#0c2323] dark:to-emerald-950 ${
                isRtl
                    ? 'bg-gradient-to-t from-sky-100 via-teal-100/70 to-emerald-700 lg:bg-gradient-to-l'
                    : 'bg-gradient-to-t from-sky-100 via-teal-100/70 to-emerald-700 lg:bg-gradient-to-r'
            }`}
        >
            {/* Ambient background glow */}
            <div
                className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent dark:from-sky-500/10 ${
                    isRtl
                        ? 'from-sky-200/50 [background-position:top_right]'
                        : 'from-sky-200/50 [background-position:top_left]'
                }`}
            />

            <div className="grid min-h-[420px] items-center gap-0 lg:grid-cols-12 lg:gap-6">
                {/* Full-width square image on mobile (< lg), side banner on desktop (lg+) */}
                <div className="relative order-first aspect-square w-full lg:order-last lg:col-span-6 lg:aspect-auto lg:h-full lg:self-stretch">
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

                {/* Text Content */}
                <div
                    className={`relative z-10 px-8 py-10 md:py-14 lg:col-span-6 ${
                        isRtl
                            ? 'text-right lg:pr-12 lg:pl-4'
                            : 'text-left lg:pr-4 lg:pl-12'
                    }`}
                >
                    {tagline ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-900/90 px-3.5 py-1.5 text-xs font-bold tracking-wider text-emerald-100 uppercase shadow-sm">
                            {tagline}
                        </span>
                    ) : null}

                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
                        {title}
                    </h1>

                    <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-700 sm:text-lg dark:text-slate-300">
                        {subtitle}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3.5">
                        <Link
                            href="/school/programs"
                            className="rounded-xl border-2 border-sky-600 bg-transparent px-6 py-2.5 text-sm font-bold text-sky-800 shadow-sm transition-all hover:bg-sky-600 hover:text-white dark:border-sky-400 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-white"
                        >
                            {primaryLabel}
                        </Link>
                        <Link
                            href="/school/contact"
                            className="rounded-xl border border-slate-300/80 bg-white/80 px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {secondaryLabel}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
