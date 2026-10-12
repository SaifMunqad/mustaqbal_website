import MainLayout from '@/layouts/app/main-layout';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchResult {
    title: string;
    subtitle?: string | null;
    href: string;
}

interface Props {
    q: string;
    results: {
        articles: SearchResult[];
        events: SearchResult[];
        books: SearchResult[];
    };
    [key: string]: unknown;
}

function ResultList({ heading, items }: { heading: string; items: SearchResult[] }) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{heading}</h2>
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-gray-900">
                {items.map((item, index) => (
                    <li key={`${item.href}-${index}`}>
                        <Link href={item.href} className="block p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                            <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                            {item.subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p> : null}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SearchPage() {
    const { q, results } = usePage<Props>().props;
    const { t } = useTranslation();
    const [term, setTerm] = useState(q);

    const total = results.articles.length + results.events.length + results.books.length;

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
                        <div className="relative flex-1 min-w-52">
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

                {q.length > 0 && total === 0 ? (
                    <p className="py-10 text-center text-slate-500">{t('search.noResults')}</p>
                ) : null}

                <ResultList heading={t('search.articles')} items={results.articles} />
                <ResultList heading={t('search.events')} items={results.events} />
                <ResultList heading={t('search.books')} items={results.books} />
            </div>
        </>
    );
}

SearchPage.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SearchPage;
