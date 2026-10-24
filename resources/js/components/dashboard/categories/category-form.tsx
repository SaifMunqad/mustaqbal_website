import { Form, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';

export interface CategoryDetail {
    id: number;
    name: string;
    slug: string;
    name_translations?: Record<string, string> | null;
}

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
    const { t } = useTranslation();

    const localeLabel = (locale: string) =>
        locale === 'ps'
            ? t('language.pashto')
            : locale === 'fa_AF'
              ? t('language.dari')
              : locale === 'ar'
                ? t('language.arabic')
                : locale;

    const remove = () => {
        if (category && window.confirm(t('dashboard.categories.form.deleteConfirm', { name: category.name }))) {
            router.delete(`${deleteUrl}`, {
                onSuccess: () => router.visit('/dashboard/categories'),
            });
        }
    };

    return (
        <Form action={action} method={method} onError={toastOnError} className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-border bg-background p-4 md:max-w-xl">
                <TextField
                    label={t('dashboard.categories.form.name')}
                    name="name"
                    required
                    defaultValue={category?.name ?? ''}
                    placeholder={t('dashboard.categories.form.namePlaceholder')}
                />
                {translationLocales.map((locale) => (
                    <TextField
                        key={locale}
                        label={localeLabel(locale)}
                        name={`name_${locale}`}
                        defaultValue={category?.name_translations?.[locale] ?? ''}
                        placeholder={t(
                            category
                                ? 'dashboard.categories.form.translationPlaceholder'
                                : 'dashboard.categories.form.translationPlaceholderOptional',
                            { language: localeLabel(locale) },
                        )}
                    />
                ))}
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit">{submitLabel}</Button>
                    {deleteUrl && category ? (
                        <Button type="button" variant="destructive" onClick={remove}>
                            {t('dashboard.categories.form.delete')}
                        </Button>
                    ) : null}
                </div>
            </div>
        </Form>
    );
}
