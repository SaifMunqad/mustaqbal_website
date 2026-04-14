import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
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
                        <input name="title" required className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="Title" />
                        <input name="excerpt" className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="Excerpt" />
                        <input name="cover_image" className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:col-span-2" placeholder="Cover image URL" />
                        <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
                            <input type="checkbox" name="is_published" value="1" className="size-4 rounded border-border" />
                            Publish now
                        </label>
                    </div>
                </DocumentFrame>

                <button className="w-fit rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700" type="submit">
                    Save article
                </button>
            </Form>
        </DashboardPage>
    );
}

