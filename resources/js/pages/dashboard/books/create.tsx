import DashboardPage from '@/components/dashboard/dashboard-page';
import BookForm, { type BookCategoryOption } from '@/components/dashboard/books/book-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface BookCreateProps {
    categories: BookCategoryOption[];
    [key: string]: unknown;
}

export default function DashboardBooksCreate() {
    const { categories } = usePage<BookCreateProps>().props;
    const { onError } = useFormToast('Book created successfully.');

    return (
        <DashboardPage titleKey="dashboard.books.createTitle">
            <BookForm
                action="/dashboard/books"
                method="post"
                submitLabel="Save book"
                categories={categories}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
