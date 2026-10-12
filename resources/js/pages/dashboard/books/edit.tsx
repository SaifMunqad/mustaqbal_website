import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { BookMediaField } from '@/components/form/book-media-field';
import { GalleryUploadField } from '@/components/form/image-upload-field';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface CategoryOption {
    id: number;
    name: string;
}

interface BookDetail {
    id: number;
    title: string;
    author?: string | null;
    published_year?: number | null;
    publisher?: string | null;
    isbn?: string | null;
    description?: string | null;
    images?: string[] | null;
    thumbnail_path?: string | null;
    thumbnail?: string | null;
    file_path?: string | null;
    file_url?: string | null;
    book_category_id?: number | null;
}

interface Props {
    book: BookDetail;
    categories: CategoryOption[];
    [key: string]: unknown;
}

export default function DashboardBooksEdit() {
    const { book, categories } = usePage<Props>().props;
    const [images, setImages] = useState<string[]>(book.images?.length ? book.images : ['']);
    const [filePath, setFilePath] = useState(book.file_path ?? '');
    const [thumbnailPath, setThumbnailPath] = useState<string | null>(book.thumbnail_path ?? null);
    const { onError } = useFormToast('Book updated successfully.');

    const remove = () => {
        if (window.confirm(`Delete "${book.title}"?`)) {
            router.delete(`/dashboard/books/${book.id}`, { onSuccess: () => router.visit('/dashboard/books') });
        }
    };

    return (
        <DashboardPage titleKey="dashboard.books.editTitle">
            <Form action={`/dashboard/books/${book.id}`} method="put" onError={onError} className="space-y-4">
                {({ errors }) => (
                    <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextField label="Title" name="title" required defaultValue={book.title} className="md:col-span-2" error={errors.title} />
                            <TextField label="Author" name="author" defaultValue={book.author ?? ''} error={errors.author} />
                            <TextField label="Publish year" name="published_year" type="number" min="1000" max="2100" defaultValue={book.published_year ?? ''} error={errors.published_year} />
                            <TextField label="Publisher / Production company" name="publisher" defaultValue={book.publisher ?? ''} error={errors.publisher} />
                            <TextField label="ISBN" name="isbn" defaultValue={book.isbn ?? ''} error={errors.isbn} />
                            <SelectField
                                label="Category"
                                name="book_category_id"
                                placeholder="No category"
                                defaultValue={book.book_category_id ? String(book.book_category_id) : ''}
                                options={[
                                    { value: '', label: 'No category' },
                                    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
                                ]}
                                error={errors.book_category_id}
                            />
                        </div>

                        <BookMediaField
                            label="Book file & cover image"
                            filePathName="file_path"
                            thumbnailPathName="thumbnail_path"
                            filePath={filePath}
                            thumbnailPath={thumbnailPath}
                            thumbnailUrl={book.thumbnail ?? null}
                            fileUrl={book.file_url}
                            onChange={(result) => {
                                setFilePath(result.file_path);
                                setThumbnailPath(result.thumbnail_path);
                            }}
                            error={errors.file_path ? String(errors.file_path) : undefined}
                        />

                        <GalleryUploadField
                            label="Additional gallery images (optional)"
                            name="images"
                            images={images}
                            onChange={setImages}
                            error={errors.images ? String(errors.images) : undefined}
                        />

                        <TextAreaField label="Description" name="description" rows={5} defaultValue={book.description ?? ''} error={errors.description} />

                        <div className="flex flex-wrap items-center gap-3">
                            <Button type="submit">Update book</Button>
                            <Button type="button" variant="destructive" onClick={remove}>
                                Delete book
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
