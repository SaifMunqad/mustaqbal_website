import DashboardPage from '@/components/dashboard/dashboard-page';
import CategoryForm from '@/components/dashboard/categories/category-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface CategoryCreateProps {
    translationLocales: string[];
    [key: string]: unknown;
}

export default function DashboardCategoriesCreate() {
    const { t } = useTranslation();
    const { translationLocales } = usePage<CategoryCreateProps>().props;
    const { onError } = useFormToast(t('dashboard.categories.created'));

    return (
        <DashboardPage titleKey="dashboard.categories.createTitle">
            <CategoryForm
                action="/dashboard/categories"
                method="post"
                submitLabel={t('dashboard.categories.form.save')}
                translationLocales={translationLocales}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
