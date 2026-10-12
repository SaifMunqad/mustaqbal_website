import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { CheckboxField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form } from '@inertiajs/react';
import articles from '@/routes/dashboard/articles';
import { useState } from 'react';

export default function DashboardArticlesCreate() {
    const [body, setBody] = useState('');
    const [images, setImages] = useState<string[]>(['']);
    const { onError } = useFormToast('Article created successfully.');

    return (
        <DashboardPage titleKey="dashboard.articles.createTitle">
            <Form {...articles.store.form()} onError={onError} className="space-y-4">
                <DocumentFrame
                    title="Article editor"
                    description="Write the article, preview it like a document, and attach one or more images."
                    body={body}
                    onBodyChange={setBody}
                    images={images}
                    onImagesChange={setImages}
                    bodyLabel="Article body"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <TextField label="Title" name="title" required placeholder="Title" className="md:col-span-2" />
                        <TextField label="Excerpt" name="excerpt" placeholder="Excerpt" />
                        <TextField label="Cover image" name="cover_image" placeholder="Cover image URL" className="md:col-span-2" />
                        <CheckboxField label="Publish now" name="is_published" value="1" className="md:col-span-2" />
                    </div>
                </DocumentFrame>

                <Button type="submit">Save article</Button>
            </Form>
        </DashboardPage>
    );
}

