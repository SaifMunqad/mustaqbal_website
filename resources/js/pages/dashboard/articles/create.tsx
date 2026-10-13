import DashboardPage from '@/components/dashboard/dashboard-page';
import ArticleForm from '@/components/dashboard/articles/article-form';
import { useFormToast } from '@/components/use-form-toast';
import articles from '@/routes/dashboard/articles';

export default function DashboardArticlesCreate() {
    const { onError } = useFormToast('Article created successfully.');

    return (
        <DashboardPage titleKey="dashboard.articles.createTitle">
            <ArticleForm
                formProps={articles.store.form()}
                submitLabel="Save article"
                cancelHref={articles.index.url()}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
