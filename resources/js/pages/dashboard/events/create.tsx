import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { CheckboxField, SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Option {
    value: string;
    label: string;
}

interface Props {
    audienceOptions: Option[];
    canPublish: boolean;
    [key: string]: unknown;
}

export default function DashboardEventsCreate() {
    const { audienceOptions, canPublish } = usePage<Props>().props;
    const [body, setBody] = useState('');
    const [images, setImages] = useState<string[]>(['']);
    const { onError } = useFormToast('Event created successfully.');

    return (
        <DashboardPage titleKey="dashboard.events.createTitle">
            <Form action="/dashboard/events" method="post" onError={onError} className="space-y-4">
                <DocumentFrame
                    title="Event editor"
                    description="Describe the event and attach photos. Set the schedule and audience below."
                    body={body}
                    onBodyChange={setBody}
                    images={images}
                    onImagesChange={setImages}
                    bodyLabel="Event details"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <TextField label="Event title" name="title" required placeholder="Event title" className="md:col-span-2" />
                        <TextField label="Short summary" name="excerpt" placeholder="Short summary" className="md:col-span-2" />
                        <TextField label="Starts at" name="start_at" type="datetime-local" required />
                        <TextField label="Ends at" name="end_at" type="datetime-local" />
                        <TextField label="Location" name="location" placeholder="Location" />
                        <TextField label="Cover image" name="cover_image" placeholder="Cover image URL" />
                        <SelectField label="Audience" name="audience" required defaultValue="public" options={audienceOptions} />
                        {canPublish ? (
                            <CheckboxField label="Publish now" name="is_published" value="1" />
                        ) : (
                            <p className="text-sm text-muted-foreground">Your event will be saved as a draft for review.</p>
                        )}
                    </div>
                </DocumentFrame>

                <Button type="submit">Save event</Button>
            </Form>
        </DashboardPage>
    );
}
