import DashboardPage from '@/components/dashboard/dashboard-page';
import EventForm, { type EventOption } from '@/components/dashboard/events/event-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface EventCreateProps {
    audienceOptions: EventOption[];
    canPublish: boolean;
    [key: string]: unknown;
}

export default function DashboardEventsCreate() {
    const { audienceOptions, canPublish } = usePage<EventCreateProps>().props;
    const { onError } = useFormToast('Event created successfully.');

    return (
        <DashboardPage titleKey="dashboard.events.createTitle">
            <EventForm
                action="/dashboard/events"
                method="post"
                submitLabel="Save event"
                cancelHref="/dashboard/events"
                audienceOptions={audienceOptions}
                canPublish={canPublish}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
