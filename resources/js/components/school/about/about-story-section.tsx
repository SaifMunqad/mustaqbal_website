/**
 * The school's story, rendered from sanitized rich text through the shared
 * `ArticleBody`, which also mounts any embedded charts.
 */
import ArticleBody from '@/components/editor/article-body';

export default function AboutStorySection({ body }: { body: string }) {
    return (
        <section className="rounded-3xl bg-brand-soft p-6 shadow-sm md:p-10">
            <ArticleBody
                body={body}
                className="text-slate-700 dark:text-slate-300"
            />
        </section>
    );
}
