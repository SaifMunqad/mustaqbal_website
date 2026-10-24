/**
 * Create screen for a calendar event.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import EventForm, { type EventOption } from '@/components/dashboard/events/event-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface EventCreateProps {
    audienceOptions: EventOption[];
    canPublish: boolean;
    [key: string]: unknown;
}

export default function DashboardEventsCreate() {
    const { t } = useTranslation();
    const { audienceOptions, canPublish } = usePage<EventCreateProps>().props;
    const { onError } = useFormToast(t('dashboard.events.created'));

    return (
        <DashboardPage titleKey="dashboard.events.createTitle">
            <EventForm
                action="/dashboard/events"
                method="post"
                submitLabel={t('dashboard.events.form.save')}
                cancelHref="/dashboard/events"
                audienceOptions={audienceOptions}
                canPublish={canPublish}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
