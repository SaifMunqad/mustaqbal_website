import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField, TextAreaField, TextField } from '@/components/form-fields';
import { useFormToast } from '@/components/use-form-toast';
import { Form } from '@inertiajs/react';
import sitePages from '@/routes/dashboard/site-pages';

export default function DashboardSitePagesCreate() {
    const { onError } = useFormToast('Page created successfully.');

    return (
        <DashboardPage titleKey="dashboard.pages.createTitle">
            <Form {...sitePages.store.form()} onError={onError} className="grid gap-3 rounded-xl border p-4">
                <TextField label="Slug" name="slug" required placeholder="slug" />
                <TextField label="Title" name="title" required placeholder="Title" />
                <TextField label="Hero image URL" name="hero_image" placeholder="Hero image URL" />
                <TextAreaField label="Content JSON" name="content" className="h-48" placeholder='JSON content, e.g. {"vision":"..."}' />
                <CheckboxField label="Published" name="is_published" value="1" defaultChecked />
                <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white" type="submit">Save</button>
            </Form>
        </DashboardPage>
    );
}

