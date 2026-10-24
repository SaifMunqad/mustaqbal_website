import type { Stat } from '@/components/school/about/about-types';

export default function AboutStatsBand({ stats }: { stats: Stat[] }) {
    return (
        <section className="rounded-3xl border border-brand-border bg-brand-soft p-6 shadow-sm md:p-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={`${stat.label}-${index}`} className="text-center">
                        <div className="text-3xl font-extrabold text-indigo-600 md:text-4xl dark:text-indigo-400">
                            {stat.value}
                        </div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
