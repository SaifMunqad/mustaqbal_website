import DashboardPage from '@/components/dashboard/dashboard-page';
import DocumentFrame from '@/components/editor/document-frame';
import {
    CheckboxField,
    SelectField,
    TextField,
} from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import {
    GalleryUploadField,
    ImageUploadField,
} from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { useFormToast } from '@/components/use-form-toast';
import {
    CalendarIcon,
    DocumentTextIcon,
    MapPinIcon,
    PhotoIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';
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
    const [coverImage, setCoverImage] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const { onError } = useFormToast('Event created successfully.');

    return (
        <DashboardPage titleKey="dashboard.events.createTitle">
            <Form action="/dashboard/events" method="post" onError={onError}>
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="space-y-4">
                                <FormSection
                                    title="Event details"
                                    description="Add a title and a short summary for listings."
                                    icon={
                                        <DocumentTextIcon className="size-5" />
                                    }
                                    columns={2}
                                >
                                    <TextField
                                        label="Event title"
                                        name="title"
                                        required
                                        placeholder="Event title"
                                        className="text-base md:col-span-2"
                                        error={errors.title}
                                    />
                                    <TextField
                                        label="Short summary"
                                        name="excerpt"
                                        placeholder="Shown in event cards"
                                        className="md:col-span-2"
                                        hint="Max 1000 characters"
                                        maxLength={1000}
                                        error={errors.excerpt}
                                    />
                                </FormSection>

                                <DocumentFrame
                                    title="Event description"
                                    description="Describe the event and preview how it reads."
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
                                        error={errors.start_at}
                                    />
                                    <TextField
                                        label="Ends at"
                                        name="end_at"
                                        type="datetime-local"
                                        error={errors.end_at}
                                    />
                                    <SelectField
                                        label="Audience"
                                        name="audience"
                                        required
                                        defaultValue="public"
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
                                            placeholder="Location"
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
                                            label="Publish now"
                                            name="is_published"
                                            value="1"
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Your event will be saved as a draft
                                            for review.
                                        </p>
                                    )}
                                    <CheckboxField
                                        label="Cancelled"
                                        name="is_cancelled"
                                        value="1"
                                    />
                                </FormSection>
                            </aside>
                        </div>

                        <StickyFormFooter
                            submitLabel="Save event"
                            processing={processing}
                            cancelHref="/dashboard/events"
                        />
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
