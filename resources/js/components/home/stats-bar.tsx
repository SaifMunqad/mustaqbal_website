import Reveal from '@/components/ui/reveal';
import { gridCols } from '@/lib/grid-cols';
import type { HomeStat } from '@/types';

/**
 * Quick-stats trust bar. Renders admin-defined numbers (students, teachers,
 * years, subjects). Returns nothing when no stats are configured so the section
 * never shows as an empty strip. An optional heading/body (authored in the
 * page builder) renders above the bar; blank keeps the original bare layout.
 */
export default function StatsBar({
    stats,
    heading,
    body,
    columns,
}: {
    stats: HomeStat[];
    heading?: string | null;
    body?: string | null;
    /** Admin-chosen track count (defaults to the four-column design). */
    columns?: number | null;
}) {
    const items = (stats ?? []).filter((stat) => stat.value || stat.label);

    if (items.length === 0) {
        return null;
    }

    const header =
        heading?.trim() || body?.trim() ? (
            <header className="mb-6 text-center">
                {heading?.trim() ? (
                    <h2 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                        {heading}
                    </h2>
                ) : null}
                {body?.trim() ? (
                    <p className="mx-auto mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
                        {body}
                    </p>
                ) : null}
            </header>
        ) : null;

    return (
        <section className="space-y-2">
            {header}
            <div
                className={`grid gap-4 rounded-3xl border border-brand-border bg-brand-soft p-6 shadow-sm ${gridCols(columns, 4)}`}
            >
                {items.map((stat, index) => (
                    <Reveal
                        key={`${stat.label}-${index}`}
                        delay={index * 60}
                        direction="zoom"
                    >
                        <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-3xl font-bold text-brand-ink md:text-4xl">
                                {stat.value}
                            </span>
                            <span className="text-sm font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                {stat.label}
                            </span>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}
