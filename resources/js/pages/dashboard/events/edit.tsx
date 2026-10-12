import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import {
    CheckboxField,
    SelectField,
    TextField,
} from '@/components/form-fields';
import ConfirmDialog from '@/components/form/confirm-dialog';
import FormSection from '@/components/form/form-section';
import {
    GalleryUploadField,
    ImageUploadField,
} from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import {
    CalendarIcon,
    DocumentTextIcon,
    MapPinIcon,
    PhotoIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';
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

const toDateTimeInput = (value?: string | null): string =>
    value ? value.slice(0, 16) : '';

export default function DashboardEventsEdit() {
    const { event, audienceOptions, canPublish, canDelete } =
        usePage<Props>().props;
    const [body, setBody] = useState(event.body ?? '');
    const [coverImage, setCoverImage] = useState(event.cover_image ?? '');
    const [images, setImages] = useState<string[]>(
        (event.images ?? []).filter(Boolean),
    );
    const { onError } = useFormToast('Event updated successfully.');

    const removeEvent = () => {
        router.delete(`/dashboard/events/${event.id}`, {
            onSuccess: () => router.visit('/dashboard/events'),
        });
    };

    return (
        <DashboardPage titleKey="dashboard.events.editTitle">
            <Form
                action={`/dashboard/events/${event.id}`}
                method="put"
                onError={onError}
            >
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="space-y-4">
                                <FormSection
                                    title="Event details"
                                    description="Update the title and short summary."
                                    icon={
                                        <DocumentTextIcon className="size-5" />
                                    }
                                    columns={2}
                                >
                                    <TextField
                                        label="Event title"
                                        name="title"
                                        required
                                        defaultValue={event.title}
                                        className="text-base md:col-span-2"
                                        error={errors.title}
                                    />
                                    <TextField
                                        label="Short summary"
                                        name="excerpt"
                                        defaultValue={event.excerpt ?? ''}
                                        className="md:col-span-2"
                                        hint="Max 1000 characters"
                                        maxLength={1000}
                                        error={errors.excerpt}
                                    />
                                </FormSection>

                                <DocumentFrame
                                    title="Event description"
                                    description="Update the details and preview how it reads."
                                    body={body}
                                    onBodyChange={setBody}
                                    bodyLabel="Event details"
                                />

                                <FormSection
                                    title="Media"
                                    description="Upload or paste image URLs for the event."
                                    icon={<PhotoIcon className="size-5" />}
                                >
                                    <ImageUploadField
                                        label="Cover image"
                                        name="cover_image"
                                        value={coverImage}
                                        onChange={setCoverImage}
                                        error={errors.cover_image}
                                    />
                                    <GalleryUploadField
                                        label="Event photos"
                                        name="images"
                                        images={images}
                                        onChange={setImages}
                                        error={
                                            errors.images
                                                ? String(errors.images)
                                                : undefined
                                        }
                                    />
                                </FormSection>
                            </div>

                            <aside className="space-y-4">
                                <FormSection
                                    title="Schedule & audience"
                                    icon={<CalendarIcon className="size-5" />}
                                >
                                    <TextField
                                        label="Starts at"
                                        name="start_at"
                                        type="datetime-local"
                                        required
                                        defaultValue={toDateTimeInput(
                                            event.start_at,
                                        )}
                                        error={errors.start_at}
                                    />
                                    <TextField
                                        label="Ends at"
                                        name="end_at"
                                        type="datetime-local"
                                        defaultValue={toDateTimeInput(
                                            event.end_at,
                                        )}
                                        error={errors.end_at}
                                    />
                                    <SelectField
                                        label="Audience"
                                        name="audience"
                                        required
                                        defaultValue={
                                            event.audience ?? 'public'
                                        }
                                        options={audienceOptions}
                                        error={errors.audience}
                                    />
                                    <div className="flex items-start gap-2">
                                        <MapPinIcon
                                            className="mt-2 size-4 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <TextField
                                            label="Location"
                                            name="location"
                                            defaultValue={event.location ?? ''}
                                            className="flex-1"
                                            error={errors.location}
                                        />
                                    </div>
                                </FormSection>

                                <FormSection
                                    title="Publishing"
                                    icon={
                                        <RocketLaunchIcon className="size-5" />
                                    }
                                >
                                    {canPublish ? (
                                        <CheckboxField
                                            label="Published"
                                            name="is_published"
                                            value="1"
                                            defaultChecked={event.is_published}
                                        />
                                    ) : null}
                                    <CheckboxField
                                        label="Cancelled"
                                        name="is_cancelled"
                                        value="1"
                                        defaultChecked={event.is_cancelled}
                                    />
                                </FormSection>
                            </aside>
                        </div>

                        <StickyFormFooter
                            submitLabel="Update event"
                            processing={processing}
                            cancelHref="/dashboard/events"
                        >
                            {canDelete ? (
                                <ConfirmDialog
                                    title="Delete event?"
                                    description={
                                        <>
                                            Delete &ldquo;{event.title}&rdquo;?
                                            This cannot be undone.
                                        </>
                                    }
                                    confirmLabel="Delete"
                                    onConfirm={removeEvent}
                                >
                                    <Button type="button" variant="destructive">
                                        Delete event
                                    </Button>
                                </ConfirmDialog>
                            ) : null}
                        </StickyFormFooter>
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
