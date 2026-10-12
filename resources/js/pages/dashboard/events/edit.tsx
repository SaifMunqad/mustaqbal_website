import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import { CheckboxField, SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Option {
    value: string;
    label: string;
}

interface EventDetail {
    id: number;
    title: string;
    excerpt?: string | null;
    body?: string | null;
    cover_image?: string | null;
    images?: string[] | null;
    location?: string | null;
    start_at: string;
    end_at?: string | null;
    audience?: string | null;
    is_published: boolean;
    is_cancelled: boolean;
}

interface Props {
    event: EventDetail;
    audienceOptions: Option[];
    canPublish: boolean;
    canDelete: boolean;
    [key: string]: unknown;
}

const toDateTimeInput = (value?: string | null): string => (value ? value.slice(0, 16) : '');

export default function DashboardEventsEdit() {
    const { event, audienceOptions, canPublish, canDelete } = usePage<Props>().props;
    const [body, setBody] = useState(event.body ?? '');
    const [images, setImages] = useState<string[]>(event.images?.length ? event.images : ['']);
    const { onError } = useFormToast('Event updated successfully.');

    const removeEvent = () => {
        if (window.confirm(`Delete "${event.title}"? This cannot be undone.`)) {
            router.delete(`/dashboard/events/${event.id}`, {
                onSuccess: () => router.visit('/dashboard/events'),
            });
        }
    };

    return (
        <DashboardPage titleKey="dashboard.events.editTitle">
            <Form action={`/dashboard/events/${event.id}`} method="put" onError={onError} className="space-y-4">
                <DocumentFrame
                    title="Event editor"
                    description="Update the event details, schedule, and audience."
                    body={body}
                    onBodyChange={setBody}
                    images={images}
                    onImagesChange={setImages}
                    bodyLabel="Event details"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <TextField label="Event title" name="title" required defaultValue={event.title} className="md:col-span-2" />
                        <TextField label="Short summary" name="excerpt" defaultValue={event.excerpt ?? ''} className="md:col-span-2" />
                        <TextField label="Starts at" name="start_at" type="datetime-local" required defaultValue={toDateTimeInput(event.start_at)} />
                        <TextField label="Ends at" name="end_at" type="datetime-local" defaultValue={toDateTimeInput(event.end_at)} />
                        <TextField label="Location" name="location" defaultValue={event.location ?? ''} />
                        <TextField label="Cover image" name="cover_image" defaultValue={event.cover_image ?? ''} />
                        <SelectField label="Audience" name="audience" required defaultValue={event.audience ?? 'public'} options={audienceOptions} />
                        <div className="flex flex-wrap gap-4">
                            {canPublish ? <CheckboxField label="Published" name="is_published" value="1" defaultChecked={event.is_published} /> : null}
                            <CheckboxField label="Cancelled" name="is_cancelled" value="1" defaultChecked={event.is_cancelled} />
                        </div>
                    </div>
                </DocumentFrame>

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit">Update event</Button>
                    {canDelete ? (
                        <Button type="button" variant="destructive" onClick={removeEvent}>
                            Delete event
                        </Button>
                    ) : null}
                </div>
            </Form>
        </DashboardPage>
    );
}
