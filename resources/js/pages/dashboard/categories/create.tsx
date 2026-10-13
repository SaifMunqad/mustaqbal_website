import DashboardPage from '@/components/dashboard/dashboard-page';
import CategoryForm from '@/components/dashboard/categories/category-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface CategoryCreateProps {
    translationLocales: string[];
    [key: string]: unknown;
}

export default function DashboardCategoriesCreate() {
    const { translationLocales } = usePage<CategoryCreateProps>().props;
    const { onError } = useFormToast('Category created successfully.');

    return (
        <DashboardPage titleKey="dashboard.categories.createTitle">
            <CategoryForm
                action="/dashboard/categories"
                method="post"
                submitLabel="Save category"
                translationLocales={translationLocales}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
