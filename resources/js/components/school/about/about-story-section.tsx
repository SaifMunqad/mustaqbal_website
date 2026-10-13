import ArticleBody from '@/components/editor/article-body';

export default function AboutStorySection({ body }: { body: string }) {
    return (
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-10 dark:bg-gray-900">
            <ArticleBody body={body} className="text-slate-700 dark:text-slate-300" />
        </section>
    );
}
