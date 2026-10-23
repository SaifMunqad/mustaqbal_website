import Reveal from '@/components/ui/reveal';
import type { HomeStat } from '@/types';

/**
 * Quick-stats trust bar. Renders admin-defined numbers (students, teachers,
 * years, subjects). Returns nothing when no stats are configured so the section
 * never shows as an empty strip.
 */
export default function StatsBar({ stats }: { stats: HomeStat[] }) {
    const items = (stats ?? []).filter((stat) => stat.value || stat.label);

    if (items.length === 0) {
        return null;
    }

    return (
        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-gray-900">
            {items.map((stat, index) => (
                <Reveal
                    key={`${stat.label}-${index}`}
                    delay={index * 60}
                    direction="zoom"
                >
                    <div className="flex flex-col items-center gap-1 text-center">
                        <span className="text-3xl font-bold text-blue-600 md:text-4xl dark:text-blue-400">
                            {stat.value}
                        </span>
                        <span className="text-sm font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                            {stat.label}
                        </span>
                    </div>
                </Reveal>
            ))}
        </section>
    );
}
