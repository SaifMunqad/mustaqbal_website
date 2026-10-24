import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import messages from '@/routes/dashboard/messages';
import { useTranslation } from 'react-i18next';

interface ConversationOption {
    id: number;
    topic?: string | null;
}

interface UserOption {
    id: number;
    name: string;
    role: string;
}

export default function DashboardMessagesCreate() {
    const { t } = useTranslation();
    const { conversations, users } = usePage<{
        conversations: ConversationOption[];
        users: UserOption[];
    }>().props;
    const { onError } = useFormToast(t('dashboard.messages.created'));

    return (
        <DashboardPage titleKey="dashboard.messages.createTitle">
            <Form {...messages.store.form()} onError={onError} className="grid gap-3 rounded-xl border p-4">
                <SelectField
                    label={t('dashboard.messages.form.conversation')}
                    name="conversation_id"
                    required
                    options={conversations.map((conversation) => ({
                        value: String(conversation.id),
                        label:
                            conversation.topic ??
                            t('dashboard.messages.form.conversationFallback', {
                                id: conversation.id,
                            }),
                    }))}
                />
                <SelectField
                    label={t('dashboard.messages.form.author')}
                    name="user_id"
                    required
                    options={users.map((user) => ({
                        value: String(user.id),
                        label: `${user.name} (${user.role})`,
                    }))}
                />
                <TextAreaField
                    label={t('dashboard.messages.form.message')}
                    name="body"
                    required
                    className="h-36"
                    placeholder={t('dashboard.messages.form.message')}
                />
                <TextField
                    label={t('dashboard.messages.form.readAt')}
                    name="read_at"
                    type="datetime-local"
                />
                <Button className="w-fit" type="submit">
                    {t('dashboard.messages.form.save')}
                </Button>
            </Form>
        </DashboardPage>
    );
}

