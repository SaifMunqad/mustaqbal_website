import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { BookMediaField } from '@/components/form/book-media-field';
import { GalleryUploadField } from '@/components/form/image-upload-field';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface CategoryOption {
    id: number;
    name: string;
}

interface Props {
    categories: CategoryOption[];
    [key: string]: unknown;
}

export default function DashboardBooksCreate() {
    const { categories } = usePage<Props>().props;
    const [images, setImages] = useState<string[]>(['']);
    const [filePath, setFilePath] = useState('');
    const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
    const { onError } = useFormToast('Book created successfully.');

    return (
        <DashboardPage titleKey="dashboard.books.createTitle">
            <Form action="/dashboard/books" method="post" onError={onError} className="space-y-4">
                {({ errors }) => (
                    <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextField label="Title" name="title" required placeholder="Title" className="md:col-span-2" error={errors.title} />
                            <TextField label="Author" name="author" placeholder="Author" error={errors.author} />
                            <TextField label="Publish year" name="published_year" type="number" min="1000" max="2100" placeholder="e.g. 2023" error={errors.published_year} />
                            <TextField label="Publisher / Production company" name="publisher" placeholder="Company that published the book" error={errors.publisher} />
                            <TextField label="ISBN" name="isbn" placeholder="ISBN" error={errors.isbn} />
                            <SelectField
                                label="Category"
                                name="book_category_id"
                                placeholder="No category"
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

                        <TextAreaField label="Description" name="description" rows={5} placeholder="Description" error={errors.description} />

                        <Button type="submit">Save book</Button>
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
