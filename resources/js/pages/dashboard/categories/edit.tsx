import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, router, usePage } from '@inertiajs/react';

interface CategoryDetail {
    id: number;
    name: string;
    slug: string;
    name_translations?: Record<string, string> | null;
}

interface Props {
    category: CategoryDetail;
    translationLocales: string[];
    [key: string]: unknown;
}

const localeLabels: Record<string, string> = {
    ps: 'Pashto',
    fa_AF: 'Dari',
    ar: 'Arabic',
};

export default function DashboardCategoriesEdit() {
    const { category, translationLocales } = usePage<Props>().props;
    const { onError } = useFormToast('Category updated successfully.');

    const remove = () => {
        if (window.confirm(`Delete "${category.name}"?`)) {
            router.delete(`/dashboard/categories/${category.id}`, {
                onSuccess: () => router.visit('/dashboard/categories'),
            });
        }
    };

    return (
        <DashboardPage titleKey="dashboard.categories.editTitle">
            <Form action={`/dashboard/categories/${category.id}`} method="put" onError={onError} className="space-y-4">
                <div className="space-y-4 rounded-2xl border border-border bg-background p-4 md:max-w-xl">
                    <TextField label="Category name" name="name" required defaultValue={category.name} />
                    {translationLocales.map((locale) => (
                        <TextField
                            key={locale}
                            label={localeLabels[locale] ?? locale}
                            name={`name_${locale}`}
                            defaultValue={category.name_translations?.[locale] ?? ''}
                            placeholder={`${localeLabels[locale] ?? locale} translation`}
                        />
                    ))}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit">Update category</Button>
                        <Button type="button" variant="destructive" onClick={remove}>
                            Delete category
                        </Button>
                    </div>
                </div>
            </Form>
        </DashboardPage>
    );
}
