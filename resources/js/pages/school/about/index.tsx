import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/layouts/app/main-layout';
import { ReactNode } from 'react';

interface AboutContent {
    vision?: string;
    manager_message?: string;
    goals?: string[];
    main_points?: string[];
}

interface AboutPageData {
    title: string;
    hero_image?: string;
    content?: AboutContent;
}

function About() {
    const { page } = usePage<{ page: AboutPageData }>().props;
    const content = page.content ?? {};

    return (
        <>
            <Head title={page.title} />

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-gray-900">
                {page.hero_image ? (
                    <img
                        src={page.hero_image}
                        alt={page.title}
                        className="h-72 w-full object-cover"
                    />
                ) : null}

                <div className="space-y-6 p-6 md:p-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {page.title}
                    </h1>

                    {content.vision ? (
                        <div>
                            <h2 className="text-xl font-semibold">Vision</h2>
                            <p className="mt-2 text-slate-700 dark:text-slate-300">
                                {content.vision}
                            </p>
                        </div>
                    ) : null}

                    {content.manager_message ? (
                        <div>
                            <h2 className="text-xl font-semibold">Manager Message</h2>
                            <p className="mt-2 text-slate-700 dark:text-slate-300">
                                {content.manager_message}
                            </p>
                        </div>
                    ) : null}

                    {content.goals?.length ? (
                        <div>
                            <h2 className="text-xl font-semibold">Goals</h2>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
                                {content.goals.map((goal) => (
                                    <li key={goal}>{goal}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {content.main_points?.length ? (
                        <div>
                            <h2 className="text-xl font-semibold">Main Points</h2>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
                                {content.main_points.map((point) => (
                                    <li key={point}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </section>
        </>
    );
}

About.layout = (page: ReactNode) => <MainLayout children={page} />;

export default About;

