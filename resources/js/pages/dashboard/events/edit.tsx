import DashboardPage from '@/components/dashboard/dashboard-page';
import EventForm, {
    type EventDetail,
    type EventOption,
    type TranslationValues,
} from '@/components/dashboard/events/event-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface EventEditProps {
    event: EventDetail;
    translations: TranslationValues;
    audienceOptions: EventOption[];
    canPublish: boolean;
    canDelete: boolean;
    [key: string]: unknown;
}

export default function DashboardEventsEdit() {
    const { event, translations, audienceOptions, canPublish, canDelete } =
        usePage<EventEditProps>().props;
    const { onError } = useFormToast('Event updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.events.editTitle">
            <EventForm
                action={`/dashboard/events/${event.id}`}
                method="put"
                submitLabel="Update event"
                cancelHref="/dashboard/events"
                audienceOptions={audienceOptions}
                canPublish={canPublish}
                event={event}
                translations={translations}
                canDelete={canDelete}
                deleteUrl={`/dashboard/events/${event.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
