import DashboardPage from '@/components/dashboard/dashboard-page';
import ArticleForm, { type Article } from '@/components/dashboard/articles/article-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import articles from '@/routes/dashboard/articles';
import type { SharedData } from '@/types';

export default function DashboardArticlesEdit() {
    const { article } = usePage<SharedData & { article: Article }>().props;
    const { onError } = useFormToast('Article updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.articles.editTitle">
            <ArticleForm
                formProps={articles.update.form(article.id)}
                submitLabel="Update article"
                cancelHref={articles.index.url()}
                article={article}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
