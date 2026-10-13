import { Form, router } from '@inertiajs/react';
import { TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';

export interface CategoryDetail {
    id: number;
    name: string;
    slug: string;
    name_translations?: Record<string, string> | null;
}

const localeLabels: Record<string, string> = {
    ps: 'Pashto',
    fa_AF: 'Dari',
    ar: 'Arabic',
};

interface CategoryFormProps {
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    translationLocales: string[];
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty.
    category?: CategoryDetail;
    // When set (edit), a destructive delete action is shown next to submit.
    deleteUrl?: string;
}

/**
 * Shared create/edit form for book categories. Renders one translation field per
 * configured locale; edit additionally seeds defaults and shows delete.
 */
export default function CategoryForm({
    action,
    method,
    submitLabel,
    translationLocales,
    toastOnError,
    category,
    deleteUrl,
}: CategoryFormProps) {
    const remove = () => {
        if (category && window.confirm(`Delete "${category.name}"?`)) {
            router.delete(`${deleteUrl}`, {
                onSuccess: () => router.visit('/dashboard/categories'),
            });
        }
    };

    return (
        <Form action={action} method={method} onError={toastOnError} className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-border bg-background p-4 md:max-w-xl">
                <TextField
                    label="Category name"
                    name="name"
                    required
                    defaultValue={category?.name ?? ''}
                    placeholder="Category name (English)"
                />
                {translationLocales.map((locale) => (
                    <TextField
                        key={locale}
                        label={localeLabels[locale] ?? locale}
                        name={`name_${locale}`}
                        defaultValue={category?.name_translations?.[locale] ?? ''}
                        placeholder={`${localeLabels[locale] ?? locale} translation${category ? '' : ' (optional)'}`}
                    />
                ))}
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit">{submitLabel}</Button>
                    {deleteUrl && category ? (
                        <Button type="button" variant="destructive" onClick={remove}>
                            Delete category
                        </Button>
                    ) : null}
                </div>
            </div>
        </Form>
    );
}
