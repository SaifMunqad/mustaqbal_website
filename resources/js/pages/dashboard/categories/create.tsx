import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';

interface Props {
    translationLocales: string[];
    [key: string]: unknown;
}

const localeLabels: Record<string, string> = {
    ps: 'Pashto',
    fa_AF: 'Dari',
    ar: 'Arabic',
};

export default function DashboardCategoriesCreate() {
    const { translationLocales } = usePage<Props>().props;
    const { onError } = useFormToast('Category created successfully.');

    return (
        <DashboardPage titleKey="dashboard.categories.createTitle">
            <Form action="/dashboard/categories" method="post" onError={onError} className="space-y-4">
                <div className="space-y-4 rounded-2xl border border-border bg-background p-4 md:max-w-xl">
                    <TextField label="Category name" name="name" required placeholder="Category name (English)" />
                    {translationLocales.map((locale) => (
                        <TextField
                            key={locale}
                            label={localeLabels[locale] ?? locale}
                            name={`name_${locale}`}
                            placeholder={`${localeLabels[locale] ?? locale} translation (optional)`}
                        />
                    ))}
                    <Button type="submit">Save category</Button>
                </div>
            </Form>
        </DashboardPage>
    );
}
