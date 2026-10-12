import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const { onError } = useFormToast('Book created successfully.');

    return (
        <DashboardPage titleKey="dashboard.books.createTitle">
            <Form action="/dashboard/books" method="post" onError={onError} className="space-y-4">
                {({ errors }) => (
                    <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextField label="Title" name="title" required placeholder="Title" className="md:col-span-2" error={errors.title} />
                            <TextField label="Author" name="author" placeholder="Author" error={errors.author} />
                            <TextField label="ISBN" name="isbn" placeholder="ISBN" error={errors.isbn} />
                            <TextField label="Price (AFN)" name="price_afn" type="number" min="0" step="0.01" required error={errors.price_afn} />
                            <TextField label="Stock" name="stock" type="number" min="0" step="1" required defaultValue={0} error={errors.stock} />
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
                            <CheckboxField label="Available for sale" name="is_available" value="1" defaultChecked />
                            <TextField label="Cover image" name="cover_image" placeholder="Cover image URL" className="md:col-span-2" error={errors.cover_image} />
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
                                        placeholder="https://example.com/image.jpg"
                                        className="flex-1"
                                        name={`images[${index}]`}
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

                        <TextAreaField label="Description" name="description" rows={5} placeholder="Description" error={errors.description} />

                        <Button type="submit">Save book</Button>
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
