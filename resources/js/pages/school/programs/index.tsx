import { Head, usePage } from '@inertiajs/react';
import { ArrowLeftRight } from 'lucide-react';
import type { ReactNode } from 'react';
import MainLayout from '@/layouts/app/main-layout';
import { cn } from '@/lib/utils';
import ProgramCard, {
    PROGRAM_ACCENTS,
    type Program,
    type ProgramType,
} from './program-card';

interface ProgramsPageData {
    title?: string;
    content?: {
        intro?: string;
    };
}

// Order the categories appear on the page and in the pathway explainer.
const TYPE_ORDER: ProgramType[] = ['school', 'courses', 'islamic_madrasa'];

// "How the programs fit together": the three tracks read as one journey —
// roots, core and enrichment — that a student can combine.
const PATHWAY: { type: ProgramType; step: string; title: string; text: string }[] = [
    {
        type: 'islamic_madrasa',
        step: 'Roots',
        title: 'Values & foundation',
        text: 'Weekend madrasa grounds every student in Quran, Arabic and Islamic studies — it runs alongside the other tracks.',
    },
    {
        type: 'school',
        step: 'Core',
        title: 'Full schooling',
        text: 'Our main classroom curriculum carries students from Kindergarten through Grade 6, following the national syllabus.',
    },
    {
        type: 'courses',
        step: 'Enrichment',
        title: 'Go deeper',
        text: 'Focused after-school courses in languages, sciences and computing let students build on the core and pursue interests.',
    },
];

function CategoryHeader({ type, count }: { type: ProgramType; count: number }) {
    const accent = PROGRAM_ACCENTS[type];
    const Icon = accent.icon;

    return (
        <div className="flex items-center gap-3">
            <div
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    accent.tile,
                )}
            >
                <Icon className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {accent.blurb.split('.')[0]}
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {count} {count === 1 ? 'program' : 'programs'}
                    </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{accent.blurb}</p>
            </div>
        </div>
    );
}

function PathwaySection() {
    return (
        <section className="mt-12">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    How the programs fit together
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    The three tracks are designed to complement each other. A student can combine
                    them into a single, well-rounded journey.
                </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
                {PATHWAY.map((item, index) => {
                    const accent = PROGRAM_ACCENTS[item.type];
                    const Icon = accent.icon;

                    return (
                        <div key={item.type} className="relative flex">
                            <div
                                className={cn(
                                    'flex flex-1 flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:bg-gray-900',
                                    accent.ring,
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex size-14 items-center justify-center rounded-2xl',
                                        accent.tile,
                                    )}
                                >
                                    <Icon className="size-7" aria-hidden />
                                </div>
                                <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    {index + 1} · {item.step}
                                </span>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    {item.text}
                                </p>
                            </div>

                            {index < PATHWAY.length - 1 ? (
                                <ArrowLeftRight
                                    className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 text-slate-300 dark:text-slate-600 md:block"
                                    aria-hidden
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function Programs() {
    const { programs, page } = usePage<{
        programs: Program[];
        page?: ProgramsPageData;
    }>().props;

    const grouped = programs.reduce<Record<ProgramType, Program[]>>(
        (carry, item) => {
            (carry[item.program_type] ??= []).push(item);
            return carry;
        },
        { school: [], courses: [], islamic_madrasa: [] },
    );

    return (
        <>
            <Head title={page?.title ?? 'Programs'} />

            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <span className="size-1.5 rounded-full bg-indigo-500" />
                    What we offer
                </div>
                <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                    {page?.title ?? 'Programs'}
                </h1>
                {page?.content?.intro ? (
                    <p className="mt-3 max-w-3xl text-slate-700 dark:text-slate-300">
                        {page.content.intro}
                    </p>
                ) : null}

                <div className="mt-10 space-y-12">
                    {TYPE_ORDER.map((type) => (
                        <div key={type}>
                            {grouped[type].length === 0 ? null : (
                                <CategoryHeader type={type} count={grouped[type].length} />
                            )}

                            {grouped[type].length > 0 ? (
                                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {grouped[type].map((program) => (
                                        <ProgramCard key={program.id} program={program} />
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-slate-500">
                                    No programs available in this category yet.
                                </p>
                            )}
                        </div>
                    ))}

                    <PathwaySection />
                </div>
            </section>
        </>
    );
}

Programs.layout = (page: ReactNode) => <MainLayout children={page} />;

export default Programs;
