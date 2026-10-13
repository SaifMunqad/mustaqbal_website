import MainLayout from '@/layouts/app/main-layout';
import BookCard, { BookCardData } from '@/components/store/book-card';
import MediaCard, { MediaCardData } from '@/components/store/media-card';
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

interface Props {
    q: string;
    isSearch: boolean;
    results: {
        articles: ArticleItem[];
        events: EventItem[];
        books: BookCardData[];
    };
    [key: string]: unknown;
}

function Section({ heading, children }: { heading: string; children: ReactNode }) {
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{heading}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
        </div>
    );
}

function SearchPage() {
    const { q, isSearch, results } = usePage<Props>().props;
    const { t, i18n } = useTranslation();
    const [term, setTerm] = useState(q);

    const locale = i18n.language === 'fa_AF' ? 'fa-AF' : i18n.language;

    const formatDate = (value?: string | null) => {
        if (!value) return null;
        try {
            return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
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
                <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('search.title')}</h1>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get('/school/search', { q: term }, { preserveState: false });
                        }}
                        className="mt-4 flex flex-wrap gap-3"
                    >
                        <div className="relative min-w-52 flex-1">
                            <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
                            <input
                                value={term}
                                onChange={(event) => setTerm(event.target.value)}
                                placeholder={t('search.placeholder')}
                                className="w-full rounded-2xl border border-border bg-background py-2 pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                            {t('search.button')}
                        </button>
                    </form>
                </section>

                {isSearch && total === 0 ? (
                    <p className="py-10 text-center text-slate-500">{t('search.noResults')}</p>
                ) : null}

                {!isSearch && total > 0 ? (
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('search.suggestions')}</h2>
                ) : null}

                {results.books.length > 0 ? (
                    <Section heading={t('search.books')}>
                        {results.books.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </Section>
                ) : null}

                {events.length > 0 ? (
                    <Section heading={t('search.events')}>
                        {events.map((item) => (
                            <MediaCard key={item.id} item={item} />
                        ))}
                    </Section>
                ) : null}

                {articles.length > 0 ? (
                    <Section heading={t('search.articles')}>
                        {articles.map((item) => (
                            <MediaCard key={item.id} item={item} />
                        ))}
                    </Section>
                ) : null}
            </div>
        </>
    );
}

SearchPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SearchPage;
