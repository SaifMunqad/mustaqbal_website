import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectField, TextField } from '@/components/form-fields';
import { BookMediaField } from '@/components/form/book-media-field';
import { GalleryUploadField } from '@/components/form/image-upload-field';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/language-tabs-editor';
import { Button } from '@/components/ui/button';

export type { TranslationValues } from '@/components/language-tabs-editor';

export interface BookCategoryOption {
    id: number;
    name: string;
}

export interface BookDetail {
    id: number;
    title?: string;
    author?: string | null;
    published_year?: number | null;
    isbn?: string | null;
    images?: string[] | null;
    thumbnail_path?: string | null;
    thumbnail?: string | null;
    file_path?: string | null;
    file_url?: string | null;
    book_category_id?: number | null;
}

// Localized inputs are built inside the component so their labels follow the
// active UI language.
interface BookFormProps {
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    categories: BookCategoryOption[];
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty.
    book?: BookDetail;
    // Existing per-language content, seeded into the localized editor on edit.
    translations?: TranslationValues;
    // When set (edit), a destructive delete action is shown next to submit.
    deleteUrl?: string;
}

/**
 * Shared create/edit form for library books. Create passes no `book`, so the
 * media/gallery state falls back to its empty defaults; edit seeds them from
 * the record and shows the delete action.
 */
export default function BookForm({
    action,
    method,
    submitLabel,
    categories,
    toastOnError,
    book,
    translations,
    deleteUrl,
}: BookFormProps) {
    const { t } = useTranslation();
    const [images, setImages] = useState<string[]>(
        book?.images?.length ? book.images : [''],
    );
    const [filePath, setFilePath] = useState(book?.file_path ?? '');
    const [thumbnailPath, setThumbnailPath] = useState<string | null>(
        book?.thumbnail_path ?? null,
    );

    const remove = () => {
        if (book && window.confirm(t('dashboard.books.form.deleteConfirm', { name: book.title }))) {
            router.delete(`${deleteUrl}`, {
                onSuccess: () => router.visit('/dashboard/books'),
            });
        }
    };

    const translatableFields: TranslatableField[] = [
        {
            name: 'title',
            label: t('dashboard.books.form.title'),
            type: 'text',
            placeholder: t('dashboard.books.form.titlePlaceholder'),
            maxLength: 255,
        },
        {
            name: 'publisher',
            label: t('dashboard.books.form.publisher'),
            type: 'text',
            placeholder: t('dashboard.books.form.publisherPlaceholder'),
            required: false,
        },
        {
            name: 'description',
            label: t('dashboard.books.form.description'),
            type: 'textarea',
            placeholder: t('dashboard.books.form.descriptionPlaceholder'),
            rows: 5,
            required: false,
        },
    ];

    return (
        <Form action={action} method={method} onError={toastOnError} className="space-y-4">
            {({ errors }) => (
                <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <TextField label={t('dashboard.books.form.author')} name="author" defaultValue={book?.author ?? ''} placeholder={t('dashboard.books.form.authorPlaceholder')} error={errors.author} />
                        <TextField label={t('dashboard.books.form.publishYear')} name="published_year" type="number" min="1000" max="2100" defaultValue={book?.published_year ?? ''} placeholder={t('dashboard.books.form.publishYearPlaceholder')} error={errors.published_year} />
                        <TextField label={t('dashboard.books.form.isbn')} name="isbn" defaultValue={book?.isbn ?? ''} placeholder={t('dashboard.books.form.isbnPlaceholder')} error={errors.isbn} />
                        <SelectField
                            label={t('dashboard.books.form.category')}
                            name="book_category_id"
                            placeholder={t('dashboard.books.form.noCategory')}
                            defaultValue={book?.book_category_id ? String(book.book_category_id) : ''}
                            options={[
                                { value: '', label: t('dashboard.books.form.noCategory') },
                                ...categories.map((category) => ({ value: String(category.id), label: category.name })),
                            ]}
                            error={errors.book_category_id}
                        />
                    </div>

                    <BookMediaField
                        label={t('dashboard.books.form.media')}
                        filePathName="file_path"
                        thumbnailPathName="thumbnail_path"
                        filePath={filePath}
                        thumbnailPath={thumbnailPath}
                        thumbnailUrl={book?.thumbnail ?? null}
                        fileUrl={book?.file_url}
                        onChange={(result) => {
                            setFilePath(result.file_path);
                            setThumbnailPath(result.thumbnail_path);
                        }}
                        error={errors.file_path ? String(errors.file_path) : undefined}
                    />

                    <GalleryUploadField
                        label={t('dashboard.books.form.gallery')}
                        name="images"
                        images={images}
                        onChange={setImages}
                        error={errors.images ? String(errors.images) : undefined}
                    />

                    <div className="grid gap-4">
                        <LanguageTabsEditor
                            fields={translatableFields}
                            translations={translations}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit">{submitLabel}</Button>
                        {deleteUrl && book ? (
                            <Button type="button" variant="destructive" onClick={remove}>
                                {t('dashboard.books.form.delete')}
                            </Button>
                        ) : null}
                    </div>
                </div>
            )}
        </Form>
    );
}
