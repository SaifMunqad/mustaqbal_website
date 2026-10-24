import DashboardPage from '@/components/dashboard/dashboard-page';
import EventForm, {
    type EventDetail,
    type EventOption,
    type TranslationValues,
} from '@/components/dashboard/events/event-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface EventEditProps {
    event: EventDetail;
    translations: TranslationValues;
    audienceOptions: EventOption[];
    canPublish: boolean;
    canDelete: boolean;
    [key: string]: unknown;
}

export default function DashboardEventsEdit() {
    const { t } = useTranslation();
    const { event, translations, audienceOptions, canPublish, canDelete } =
        usePage<EventEditProps>().props;
    const { onError } = useFormToast(t('dashboard.events.updated'));

    return (
        <DashboardPage titleKey="dashboard.events.editTitle">
            <EventForm
                action={`/dashboard/events/${event.id}`}
                method="put"
                submitLabel={t('dashboard.events.form.update')}
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
