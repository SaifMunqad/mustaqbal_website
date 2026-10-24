import DashboardPage from '@/components/dashboard/dashboard-page';
import BookForm, {
    type BookCategoryOption,
    type BookDetail,
    type TranslationValues,
} from '@/components/dashboard/books/book-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface BookEditProps {
    book: BookDetail;
    translations: TranslationValues;
    categories: BookCategoryOption[];
    [key: string]: unknown;
}

export default function DashboardBooksEdit() {
    const { t } = useTranslation();
    const { book, translations, categories } = usePage<BookEditProps>().props;
    const { onError } = useFormToast(t('dashboard.books.updated'));

    return (
        <DashboardPage titleKey="dashboard.books.editTitle">
            <BookForm
                action={`/dashboard/books/${book.id}`}
                method="put"
                submitLabel={t('dashboard.books.form.update')}
                categories={categories}
                book={book}
                translations={translations}
                deleteUrl={`/dashboard/books/${book.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
