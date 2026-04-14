import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/layouts/app/main-layout';
import { ReactNode } from 'react';

type ProgramType = 'school' | 'courses' | 'islamic_madrasa';

interface Program {
    id: number;
    name: string;
    program_type: ProgramType;
    program_type_label: string;
    description: string;
    schedule: string;
    fees: string;
    age_recommendation: string;
    classroom_number?: string | null;
    available_for_enroll: boolean;
}

interface ProgramsPageData {
    title?: string;
    content?: {
        intro?: string;
    };
}

function Programs() {
    const { programs, page } = usePage<{
        programs: Program[];
        page?: ProgramsPageData;
    }>().props;

    const grouped = programs.reduce<Record<ProgramType, Program[]>>(
        (carry, item) => {
            carry[item.program_type].push(item);
            return carry;
        },
        { school: [], courses: [], islamic_madrasa: [] },
    );

    return (
        <>
            <Head title={page?.title ?? 'Programs'} />

            <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900 md:p-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {page?.title ?? 'Programs'}
                </h1>
                {page?.content?.intro ? (
                    <p className="mt-3 text-slate-700 dark:text-slate-300">
                        {page.content.intro}
                    </p>
                ) : null}

                <div className="mt-8 space-y-10">
                    {(Object.keys(grouped) as ProgramType[]).map((type) => (
                        <div key={type}>
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                {grouped[type][0]?.program_type_label ?? type}
                            </h2>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {grouped[type].map((program) => (
                                    <article
                                        key={program.id}
                                        className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                                    >
                                        <h3 className="text-lg font-semibold">{program.name}</h3>
                                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                            {program.description}
                                        </p>
                                        <div className="mt-3 space-y-1 text-sm">
                                            <p><strong>Schedule:</strong> {program.schedule}</p>
                                            <p><strong>Fees:</strong> {program.fees}</p>
                                            <p><strong>Age:</strong> {program.age_recommendation}</p>
                                            <p>
                                                <strong>Classroom:</strong>{' '}
                                                {program.classroom_number ?? 'TBD'}
                                            </p>
                                            <p>
                                                <strong>Enrollment:</strong>{' '}
                                                {program.available_for_enroll
                                                    ? 'Available'
                                                    : 'Closed'}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                                {grouped[type].length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        No programs available in this category yet.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}

Programs.layout = (page: ReactNode) => <MainLayout children={page} />;

export default Programs;

