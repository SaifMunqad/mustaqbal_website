import { useTranslation } from 'react-i18next';
import { CheckCircle2, GraduationCap, Target } from 'lucide-react';

interface AboutGoalsPointsSectionProps {
    goals: string[];
    mainPoints: string[];
}

export default function AboutGoalsPointsSection({ goals, mainPoints }: AboutGoalsPointsSectionProps) {
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
