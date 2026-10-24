import BookCard, { BookCardData } from '@/components/store/book-card';
import MediaCard, { MediaCardData } from '@/components/store/media-card';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ArticleItem {
    id: number;
    title: string;
    href: string;
    image?: string | null;
    subtitle?: string | null;
    date?: string | null;
}

interface EventItem {
    id: number;
    title: string;
    href: string;
    image?: string | null;
    subtitle?: string | null;
    date?: string | null;
}

interface SchoolSearchProps {
    q: string;
    isSearch: boolean;
    results: {
        articles: ArticleItem[];
        events: EventItem[];
        books: BookCardData[];
    };
    [key: string]: unknown;
}

function Section({
    heading,
    children,
}: {
    heading: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {heading}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {children}
            </div>
        </div>
    );
}

function SchoolSearch() {
    const { q, isSearch, results } = usePage<SchoolSearchProps>().props;
    const { t, i18n } = useTranslation();
    const [term, setTerm] = useState(q);

    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;

    const formatDate = (value?: string | null) => {
        if (!value) return null;
        try {
            return new Intl.DateTimeFormat(locale, {
                dateStyle: 'medium',
            }).format(new Date(value));
        } catch {
            return null;
        }
    };

    const toMedia = (item: ArticleItem | EventItem): MediaCardData => ({
        id: item.id,
        title: item.title,
        href: item.href,
        image: item.image,
        subtitle: item.subtitle,
        badge: formatDate(item.date),
    });

    const articles = results.articles.map(toMedia);
    const events = results.events.map(toMedia);
    const total = articles.length + events.length + results.books.length;

    return (
        <>
            <Head title={t('search.title')} />

            <div className="space-y-6">
                <Reveal direction="fade" defaultInView>
                    <section className="rounded-3xl bg-brand-soft p-6 shadow-sm">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {t('search.title')}
                        </h1>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get(
                                    '/school/search',
                                    { q: term },
                                    { preserveState: false },
                                );
                            }}
                            className="mt-4 flex flex-wrap gap-3"
                        >
                            <div className="relative min-w-52 flex-1">
                                <MagnifyingGlassIcon className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={term}
                                    onChange={(event) =>
                                        setTerm(event.target.value)
                                    }
                                    placeholder={t('search.placeholder')}
                                    className="w-full rounded-2xl border border-border bg-background py-2 ps-10 pe-3 text-sm transition outline-none focus:border-brand-border focus:ring-2 focus:ring-brand/20"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-brand-fg transition hover:bg-brand-hover"
                            >
                                {t('search.button')}
                            </button>
                        </form>
                    </section>
                </Reveal>

                {isSearch && total === 0 ? (
                    <p className="py-10 text-center text-slate-500">
                        {t('search.noResults')}
                    </p>
                ) : null}

                {!isSearch && total > 0 ? (
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {t('search.suggestions')}
                    </h2>
                ) : null}

                {results.books.length > 0 ? (
                    <Reveal>
                        <Section heading={t('search.books')}>
                            {results.books.map((book, index) => (
                                <Reveal key={book.id} delay={index * 40}>
                                    <BookCard book={book} />
                                </Reveal>
                            ))}
                        </Section>
                    </Reveal>
                ) : null}

                {events.length > 0 ? (
                    <Reveal>
                        <Section heading={t('search.events')}>
                            {events.map((item, index) => (
                                <Reveal key={item.id} delay={index * 40}>
                                    <MediaCard item={item} />
                                </Reveal>
                            ))}
                        </Section>
                    </Reveal>
                ) : null}

                {articles.length > 0 ? (
                    <Reveal>
                        <Section heading={t('search.articles')}>
                            {articles.map((item, index) => (
                                <Reveal key={item.id} delay={index * 40}>
                                    <MediaCard item={item} />
                                </Reveal>
                            ))}
                        </Section>
                    </Reveal>
                ) : null}
            </div>
        </>
    );
}

SchoolSearch.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolSearch;
