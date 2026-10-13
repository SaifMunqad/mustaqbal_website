import DashboardPage from '@/components/dashboard/dashboard-page';
import BookForm, {
    type BookCategoryOption,
    type BookDetail,
} from '@/components/dashboard/books/book-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface BookEditProps {
    book: BookDetail;
    categories: BookCategoryOption[];
    [key: string]: unknown;
}

export default function DashboardBooksEdit() {
    const { book, categories } = usePage<BookEditProps>().props;
    const { onError } = useFormToast('Book updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.books.editTitle">
            <BookForm
                action={`/dashboard/books/${book.id}`}
                method="put"
                submitLabel="Update book"
                categories={categories}
                book={book}
                deleteUrl={`/dashboard/books/${book.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
