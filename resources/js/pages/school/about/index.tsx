import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/layouts/app/main-layout';
import ArticleBody from '@/components/editor/article-body';
import { ReactNode } from 'react';
import type { SiteSettings } from '@/types';

interface AboutContent {
    body?: string;
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
    const { page, site } = usePage<{ page: AboutPageData | null; site: SiteSettings }>().props;
    const content = page?.content ?? {};
    const title = page?.title ?? site?.brand_name ?? '';
    const heroImage = page?.hero_image ?? site?.home?.hero_image ?? null;
    // Rich-text body authored from the dashboard takes precedence over the
    // legacy structured fields (vision / goals / ...).
    const body = content.body?.trim();
    const hasLegacyContent =
        Boolean(content.vision) ||
        Boolean(content.manager_message) ||
        Boolean(content.goals?.length) ||
        Boolean(content.main_points?.length);

    return (
        <>
            <Head title={title} />

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-gray-900">
                {heroImage ? (
                    <img
                        src={heroImage}
                        alt={title}
                        className="h-72 w-full object-cover"
                    />
                ) : null}

                <div className="space-y-6 p-6 md:p-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {title}
                    </h1>

                    {body ? (
                        <ArticleBody
                            body={body}
                            className="text-slate-700 dark:text-slate-300"
                        />
                    ) : null}

                    {!body && hasLegacyContent ? (
                        <>
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
                        </>
                    ) : null}
                </div>
            </section>
        </>
    );
}

About.layout = (page: ReactNode) => <MainLayout children={page} />;

export default About;

