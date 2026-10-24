import DashboardPage from '@/components/dashboard/dashboard-page';
import ArticleForm, { type Article } from '@/components/dashboard/articles/article-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { usePage } from '@inertiajs/react';
import articles from '@/routes/dashboard/articles';
import type { SharedData } from '@/types';
import { useTranslation } from 'react-i18next';

export default function DashboardArticlesEdit() {
    const { t } = useTranslation();
    const { article } = usePage<SharedData & { article: Article }>().props;
    const { onError } = useFormToast(t('dashboard.articles.updated'));

    return (
        <DashboardPage titleKey="dashboard.articles.editTitle">
            <ArticleForm
                formProps={articles.update.form(article.id)}
                submitLabel={t('dashboard.articles.form.update')}
                cancelHref={articles.index.url()}
                article={article}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
