import { Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AboutHeroProps {
    title: string;
    intro?: string;
    image?: string | null;
    tagline?: string;
    enrollLabel: string;
    contactLabel: string;
}

export default function AboutHero({
    title,
    intro,
    image,
    tagline,
    enrollLabel,
    contactLabel,
}: AboutHeroProps) {
    return (
        <section className="relative overflow-hidden rounded-3xl shadow-sm">
            {image ? (
                <img
                    src={image}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-brand" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/70 to-slate-900/40" />

            <div className="relative flex flex-col items-start gap-5 px-6 py-16 md:px-12 md:py-24">
                {/* These sit on a neutral dark image overlay, not a brand fill,
                    so the label stays white whatever the school color is. */}
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase ring-1 ring-white/25 backdrop-blur">
                    <Sparkles className="size-3.5" aria-hidden />
                    {tagline}
                </div>
                <h1 className="max-w-3xl text-3xl leading-tight font-extrabold text-white md:text-5xl">
                    {title}
                </h1>
                {intro ? (
                    <p className="max-w-2xl text-base text-slate-100/90 md:text-lg">
                        {intro}
                    </p>
                ) : null}
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
