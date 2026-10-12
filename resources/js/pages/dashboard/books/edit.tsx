import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    isbn?: string | null;
    description?: string | null;
    price_afn: number;
    stock: number;
    cover_image?: string | null;
    images?: string[] | null;
    book_category_id?: number | null;
    is_available: boolean;
}

interface Props {
    book: BookDetail;
    categories: CategoryOption[];
    [key: string]: unknown;
}

export default function DashboardBooksEdit() {
    const { book, categories } = usePage<Props>().props;
    const [images, setImages] = useState<string[]>(book.images?.length ? book.images : ['']);
    const { onError } = useFormToast('Book updated successfully.');

    const remove = () => {
        if (window.confirm(`Delete "${book.title}"?`)) {
            router.delete(`/dashboard/books/${book.id}`, { onSuccess: () => router.visit('/dashboard/books') });
        }
    };

    return (
        <DashboardPage titleKey="dashboard.books.editTitle">
            <Form action={`/dashboard/books/${book.id}`} method="put" onError={onError} className="space-y-4">
                <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <TextField label="Title" name="title" required defaultValue={book.title} className="md:col-span-2" />
                        <TextField label="Author" name="author" defaultValue={book.author ?? ''} />
                        <TextField label="ISBN" name="isbn" defaultValue={book.isbn ?? ''} />
                        <TextField label="Price (AFN)" name="price_afn" type="number" min="0" step="0.01" required defaultValue={book.price_afn} />
                        <TextField label="Stock" name="stock" type="number" min="0" step="1" required defaultValue={book.stock} />
                        <SelectField
                            label="Category"
                            name="book_category_id"
                            placeholder="No category"
                            defaultValue={book.book_category_id ? String(book.book_category_id) : ''}
                            options={[
                                { value: '', label: 'No category' },
                                ...categories.map((category) => ({ value: String(category.id), label: category.name })),
                            ]}
                        />
                        <CheckboxField label="Available for sale" name="is_available" value="1" defaultChecked={book.is_available} />
                        <TextField label="Cover image" name="cover_image" defaultValue={book.cover_image ?? ''} className="md:col-span-2" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Gallery images</p>
                        {images.map((image, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    type="url"
                                    value={image}
                                    onChange={(event) => {
                                        const next = [...images];
                                        next[index] = event.target.value;
                                        setImages(next);
                                    }}
                                    name={`images[${index}]`}
                                    className="flex-1"
                                />
                                <Button type="button" variant="ghost" size="sm" onClick={() => setImages(images.filter((_, i) => i !== index))}>
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="link" size="sm" onClick={() => setImages([...images, ''])}>
                            + Add image
                        </Button>
                    </div>

                    <TextAreaField label="Description" name="description" rows={5} defaultValue={book.description ?? ''} />

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit">Update book</Button>
                        <Button type="button" variant="destructive" onClick={remove}>
                            Delete book
                        </Button>
                    </div>
                </div>
            </Form>
        </DashboardPage>
    );
}
