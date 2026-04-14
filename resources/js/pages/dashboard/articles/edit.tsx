import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
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
                        <input name="title" required defaultValue={article.title} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <input name="excerpt" defaultValue={article.excerpt ?? ''} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <input name="cover_image" defaultValue={article.cover_image ?? ''} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:col-span-2" placeholder="Cover image URL" />
                        <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
                            <input type="checkbox" name="is_published" value="1" defaultChecked={article.is_published} className="size-4 rounded border-border" />
                            Published
                        </label>
                    </div>
                </DocumentFrame>

                <button className="w-fit rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700" type="submit">
                    Update article
                </button>
            </Form>
        </DashboardPage>
    );
}

