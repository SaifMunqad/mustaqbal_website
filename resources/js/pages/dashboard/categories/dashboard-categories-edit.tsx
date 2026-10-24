import DashboardPage from '@/components/dashboard/dashboard-page';
import CategoryForm, {
    type CategoryDetail,
} from '@/components/dashboard/categories/category-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface CategoryEditProps {
    category: CategoryDetail;
    translationLocales: string[];
    [key: string]: unknown;
}

export default function DashboardCategoriesEdit() {
    const { t } = useTranslation();
    const { category, translationLocales } = usePage<CategoryEditProps>().props;
    const { onError } = useFormToast(t('dashboard.categories.updated'));

    return (
        <DashboardPage titleKey="dashboard.categories.editTitle">
            <CategoryForm
                action={`/dashboard/categories/${category.id}`}
                method="put"
                submitLabel={t('dashboard.categories.form.update')}
                translationLocales={translationLocales}
                category={category}
                deleteUrl={`/dashboard/categories/${category.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
