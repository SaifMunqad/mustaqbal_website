/**
 * Create screen for an article. Binds the shared `ArticleForm` to the store route
 * and wires the error toast.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import ArticleForm from '@/components/dashboard/articles/article-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import articles from '@/routes/dashboard/articles';
import { useTranslation } from 'react-i18next';

export default function DashboardArticlesCreate() {
    const { t } = useTranslation();
    const { onError } = useFormToast(t('dashboard.articles.created'));

    return (
        <DashboardPage titleKey="dashboard.articles.createTitle">
            <ArticleForm
                formProps={articles.store.form()}
                submitLabel={t('dashboard.articles.form.save')}
                cancelHref={articles.index.url()}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
