/**
 * Public article detail: metadata, the rendered body and a share action.
 */
import ArticleBody from '@/components/editor/article-body';
import ShareButton from '@/components/general/elements/share-button';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Article {
    id: number;
    slug: string;
    title: string;
    excerpt?: string | null;
    body: string;
    cover_image?: string | null;
    images?: string[] | null;
    published_at?: string | null;
    author?: { name: string } | null;
    writer_name?: string | null;
    language?: string | null;
    language_dir?: 'rtl' | 'ltr';
}

function SchoolArticlesShow() {
    const { t } = useTranslation();
    const { article } = usePage<{ article: Article }>().props;
    const gallery = (article.images ?? []).filter((image): image is string =>
        Boolean(image),
    );
    const byline =
        article.writer_name ??
        article.author?.name ??
        t('articles.defaultAuthor');
    // The article renders in its own language direction, independent of the
    // surrounding UI (which follows the reader's selected language).
    const contentDir = article.language_dir ?? 'ltr';

    return (
        <>
            <Head title={article.title} />

            {/* Content sits directly on the frozen page background: an extra
                tinted panel here would swallow the article body. */}
            <section className="p-6 md:p-10">
                <Reveal direction="fade" defaultInView>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href="/school/articles"
                            className="text-sm font-medium text-brand-ink underline"
                        >
                            {t('articles.back')}
                        </Link>
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {article.published_at ??
                                    t('articles.unpublished')}
                            </p>
                            <ShareButton
                                url={
                                    typeof window !== 'undefined'
                                        ? `${window.location.origin}/school/articles/${article.slug}`
                                        : `/school/articles/${article.slug}`
                                }
                                title={article.title}
                            />
                        </div>
                    </div>
                </Reveal>

                <Reveal>
                    <div dir={contentDir} className="space-y-6">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span className="rounded-full bg-brand-soft px-3 py-1">
                                {t('articles.by', { name: byline })}
                            </span>
                            <span className="rounded-full bg-brand-soft px-3 py-1">
                                {article.published_at
                                    ? t('articles.published')
                                    : t('articles.draft')}
                            </span>
                        </div>

                        {article.cover_image ? (
                            <img
                                src={article.cover_image}
                                alt={article.title}
                                className="max-h-80 w-full rounded-2xl object-cover"
                            />
                        ) : null}

                        {article.excerpt ? (
                            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                                {article.excerpt}
                            </p>
                        ) : null}

                        <ArticleBody body={article.body} dir={contentDir} />

                        {gallery.length ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {gallery.map((image, index) => (
                                    <img
                                        key={`${index}-${image}`}
                                        src={image}
                                        alt={`${article.title} image ${index + 1}`}
                                        className="h-44 w-full rounded-2xl object-cover"
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                </Reveal>
            </section>
        </>
    );
}

SchoolArticlesShow.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolArticlesShow;
