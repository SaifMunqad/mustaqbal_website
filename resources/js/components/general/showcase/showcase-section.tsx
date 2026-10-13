import Reveal from '@/components/ui/reveal';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export interface ShowcasePost {
    id: number;
    title: string;
    excerpt?: string | null;
    images?: string[] | null;
    honoree?: string | null;
    created_at?: string | null;
}

export interface ShowcaseGroup {
    type: string;
    label: string;
    posts: ShowcasePost[];
}

function HonoreeCard({ post }: { post: ShowcasePost }) {
    const image = post.images?.[0];

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-gray-900">
            {image ? (
                <img
                    src={image}
                    alt={post.honoree ?? post.title}
                    className="h-32 w-full rounded-xl object-cover"
                />
            ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-xl bg-blue-600 text-3xl font-bold text-white">
                    {(post.honoree ?? post.title).slice(0, 1)}
                </div>
            )}
            <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                    {post.honoree ?? post.title}
                </p>
                {post.honoree ? (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {post.title}
                    </p>
                ) : null}
                {post.excerpt ? (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {post.excerpt}
                    </p>
                ) : null}
                {post.created_at ? (
                    <p className="mt-2 text-xs text-slate-400">
                        {post.created_at}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

export default function ShowcaseSection({
    groups,
    headingKey = 'showcase.title',
    withHeading = true,
}: {
    groups: ShowcaseGroup[];
    headingKey?: string;
    withHeading?: boolean;
}) {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';

    if (groups.length === 0) {
        return (
            <section className="rounded-3xl bg-white p-6 text-center shadow-sm md:p-10 dark:bg-gray-900">
                <p className="text-slate-500 dark:text-slate-400">
                    {t('showcase.empty')}
                </p>
            </section>
        );
    }

    return (
        <section
            dir={i18n.dir()}
            className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}
        >
            {withHeading ? (
                <div className={`flex items-center justify-between gap-3`}>
                    <h2 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                        {t(headingKey)}
                    </h2>
                    <Link
                        href="/school/showcase"
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-800/60"
                    >
                        {t('showcase.viewAll')}
                    </Link>
                </div>
            ) : null}

            {groups.map((group) => (
                <div key={group.type} className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                        {group.label}
                    </h3>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {group.posts.map((post, index) => (
                            <Reveal key={post.id} delay={index * 100}>
                                <HonoreeCard post={post} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}
