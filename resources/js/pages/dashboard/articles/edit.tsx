import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { CheckboxField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import articles from '@/routes/dashboard/articles';
import { useState } from 'react';

interface Article {
    id: number;
    title: string;
    excerpt?: string | null;
    body: string;
    cover_image?: string | null;
    images?: string[] | null;
    is_published: boolean;
}

export default function DashboardArticlesEdit() {
    const { article } = usePage<{ article: Article }>().props;
    const [body, setBody] = useState(article.body);
    const [images, setImages] = useState<string[]>(article.images?.length ? article.images : ['']);
    const { onError } = useFormToast('Article updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.articles.editTitle">
            <Form {...articles.update.form(article.id)} onError={onError} className="space-y-4">
                <DocumentFrame
                    title="Article editor"
                    description="Keep the writing and preview in sync while editing the article."
                    body={body}
                    onBodyChange={setBody}
                    images={images}
                    onImagesChange={setImages}
                    bodyLabel="Article body"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <TextField label="Title" name="title" required defaultValue={article.title} className="md:col-span-2" />
                        <TextField label="Excerpt" name="excerpt" defaultValue={article.excerpt ?? ''} />
                        <TextField label="Cover image" name="cover_image" defaultValue={article.cover_image ?? ''} placeholder="Cover image URL" className="md:col-span-2" />
                        <CheckboxField label="Published" name="is_published" value="1" defaultChecked={article.is_published} className="md:col-span-2" />
                    </div>
                </DocumentFrame>

                <Button type="submit">Update article</Button>
            </Form>
        </DashboardPage>
    );
}

