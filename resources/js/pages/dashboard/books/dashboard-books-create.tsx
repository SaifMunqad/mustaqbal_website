import DashboardPage from '@/components/dashboard/dashboard-page';
import BookForm, { type BookCategoryOption } from '@/components/dashboard/books/book-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface BookCreateProps {
    categories: BookCategoryOption[];
    [key: string]: unknown;
}

export default function DashboardBooksCreate() {
    const { t } = useTranslation();
    const { categories } = usePage<BookCreateProps>().props;
    const { onError } = useFormToast(t('dashboard.books.created'));

    return (
        <DashboardPage titleKey="dashboard.books.createTitle">
            <BookForm
                action="/dashboard/books"
                method="post"
                submitLabel={t('dashboard.books.form.save')}
                categories={categories}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
