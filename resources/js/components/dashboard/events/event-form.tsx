import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/editor/language-tabs-editor';
import ConfirmDialog from '@/components/form/confirm-dialog';
import {
    CheckboxField,
    DateTimeField,
    SelectField,
} from '@/components/form/form-fields';
import FormSection from '@/components/form/form-section';
import {
    GalleryUploadField,
    ImageUploadField,
} from '@/components/form/image-upload-field';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { Button } from '@/components/ui/button';
import {
    CalendarIcon,
    DocumentTextIcon,
    PhotoIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type { TranslationValues } from '@/components/editor/language-tabs-editor';

export interface EventOption {
    value: string;
    label: string;
}

export interface EventDetail {
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

// datetime-local inputs need the trailing seconds/milliseconds trimmed off.
const toDateTimeInput = (value?: string | null): string =>
    value ? value.slice(0, 16) : '';

interface EventFormProps {
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    cancelHref: string;
    audienceOptions: EventOption[];
    canPublish: boolean;
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty and defaults apply.
    event?: EventDetail;
    // Existing per-language content, seeded into the localized editor on edit.
    translations?: TranslationValues;
    // Edit-only: when true a destructive delete action is shown in the footer.
    canDelete?: boolean;
    deleteUrl?: string;
}

// Localized inputs are built inside the component so their labels follow the
// active UI language.

/**
 * Shared create/edit form for events. The publishing block and a couple of
 * helper texts differ between modes; everything else is driven by whether an
 * `event` record is supplied.
 */
export default function EventForm({
    action,
    method,
    submitLabel,
    cancelHref,
    audienceOptions,
    canPublish,
    toastOnError,
    event,
    translations,
    canDelete,
    deleteUrl,
}: EventFormProps) {
    const { t } = useTranslation();
    const isEdit = Boolean(event);
    const [coverImage, setCoverImage] = useState(event?.cover_image ?? '');
    const [images, setImages] = useState<string[]>(
        (event?.images ?? []).filter(Boolean),
    );

    const removeEvent = () => {
        if (!event) {
            return;
        }
        router.delete(`${deleteUrl}`, {
            onSuccess: () => router.visit('/dashboard/events'),
        });
    };

    const translatableFields: TranslatableField[] = [
        {
            name: 'title',
            label: t('dashboard.events.form.title'),
            type: 'text',
            placeholder: t('dashboard.events.form.titlePlaceholder'),
            maxLength: 255,
        },
        {
            name: 'excerpt',
            label: t('dashboard.events.form.excerpt'),
            type: 'text',
            placeholder: t('dashboard.events.form.excerptPlaceholder'),
            hint: t('dashboard.events.form.excerptHint'),
            maxLength: 1000,
        },
        {
            name: 'location',
            label: t('dashboard.events.form.location'),
            type: 'text',
            placeholder: t('dashboard.events.form.location'),
        },
        {
            name: 'body',
            label: t('dashboard.events.form.details'),
            type: 'richtext',
            placeholder: t('dashboard.events.form.detailsPlaceholder'),
        },
    ];

    return (
        <Form action={action} method={method} onError={toastOnError}>
            {({ errors, processing }) => (
                <div className="space-y-4">
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                        <div className="space-y-4">
                            <FormSection
                                title={t('dashboard.events.form.localized')}
                                description={t(
                                    'dashboard.events.form.localizedDescription',
                                )}
                                icon={<DocumentTextIcon className="size-5" />}
                            >
                                <LanguageTabsEditor
                                    fields={translatableFields}
                                    translations={translations}
                                />
                            </FormSection>

                            <FormSection
                                title={t('dashboard.events.form.media')}
                                description={t(
                                    'dashboard.events.form.mediaDescription',
                                )}
                                icon={<PhotoIcon className="size-5" />}
                            >
                                <ImageUploadField
                                    label={t(
                                        'dashboard.events.form.coverImage',
                                    )}
                                    name="cover_image"
                                    value={coverImage}
                                    onChange={setCoverImage}
                                    error={errors.cover_image}
                                />
                                <GalleryUploadField
                                    label={t('dashboard.events.form.photos')}
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
                                title={t('dashboard.events.form.schedule')}
                                icon={<CalendarIcon className="size-5" />}
                            >
                                <DateTimeField
                                    label={t('dashboard.events.form.startsAt')}
                                    name="start_at"
                                    required
                                    defaultValue={
                                        event
                                            ? toDateTimeInput(event.start_at)
                                            : ''
                                    }
                                    error={errors.start_at}
                                />
                                <DateTimeField
                                    label={t('dashboard.events.form.endsAt')}
                                    name="end_at"
                                    defaultValue={
                                        event
                                            ? toDateTimeInput(event.end_at)
                                            : ''
                                    }
                                    error={errors.end_at}
                                />
                                <SelectField
                                    label={t('dashboard.events.form.audience')}
                                    name="audience"
                                    required
                                    defaultValue={event?.audience ?? 'public'}
                                    options={audienceOptions}
                                    error={errors.audience}
                                />
                            </FormSection>

                            <FormSection
                                title={t('dashboard.events.form.publishing')}
                                icon={<RocketLaunchIcon className="size-5" />}
                            >
                                {canPublish ? (
                                    <CheckboxField
                                        label={
                                            isEdit
                                                ? t('dashboard.form.published')
                                                : t('dashboard.form.publishNow')
                                        }
                                        name="is_published"
                                        value="1"
                                        defaultChecked={event?.is_published}
                                    />
                                ) : isEdit ? null : (
                                    <p className="text-sm text-muted-foreground">
                                        {t('dashboard.events.form.draftNotice')}
                                    </p>
                                )}
                                <CheckboxField
                                    label={t('dashboard.events.form.cancelled')}
                                    name="is_cancelled"
                                    value="1"
                                    defaultChecked={event?.is_cancelled}
                                />
                            </FormSection>
                        </aside>
                    </div>

                    <StickyFormFooter
                        submitLabel={submitLabel}
                        processing={processing}
                        cancelHref={cancelHref}
                    >
                        {isEdit && canDelete && event ? (
                            <ConfirmDialog
                                title={t('dashboard.events.form.deleteTitle')}
                                description={t(
                                    'dashboard.events.form.deleteDescription',
                                    { name: event.title },
                                )}
                                confirmLabel={t('dashboard.form.delete')}
                                onConfirm={removeEvent}
                            >
                                <Button type="button" variant="destructive">
                                    {t('dashboard.events.form.delete')}
                                </Button>
                            </ConfirmDialog>
                        ) : null}
                    </StickyFormFooter>
                </div>
            )}
        </Form>
    );
}
