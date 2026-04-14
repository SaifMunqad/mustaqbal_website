import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, TextAreaField, TextField } from '@/components/form-fields';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import sitePages from '@/routes/dashboard/site-pages';

interface SitePage {
    id: number;
    slug: string;
    title: string;
    hero_image?: string | null;
    is_published: boolean;
}

export default function DashboardSitePagesEdit() {
    const { page, contentJson } = usePage<{ page: SitePage; contentJson: string }>().props;
    const { onError } = useFormToast('Page updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.pages.editTitle">
            <Form {...sitePages.update.form(page.id)} onError={onError} className="grid gap-3 rounded-xl border p-4">
                <TextField label="Slug" name="slug" required defaultValue={page.slug} />
                <TextField label="Title" name="title" required defaultValue={page.title} />
                <TextField label="Hero image URL" name="hero_image" defaultValue={page.hero_image ?? ''} />
                <TextAreaField label="Content JSON" name="content" defaultValue={contentJson} className="h-48" />
                <CheckboxField label="Published" name="is_published" value="1" defaultChecked={page.is_published} />
                <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white" type="submit">Update</button>
            </Form>
        </DashboardPage>
    );
}

