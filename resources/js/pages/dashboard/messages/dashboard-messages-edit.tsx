import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextAreaField, TextField } from '@/components/form/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/feedback/use-form-toast';
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

interface Message {
    id: number;
    conversation_id: number;
    user_id: number;
    body: string;
    read_at?: string | null;
}

const toDateTimeInput = (value?: string | null): string => {
    if (!value) return '';
    return value.slice(0, 16);
};

export default function DashboardMessagesEdit() {
    const { t } = useTranslation();
    const { message, conversations, users } = usePage<{
        message: Message;
        conversations: ConversationOption[];
        users: UserOption[];
    }>().props;
    const { onError } = useFormToast(t('dashboard.messages.updated'));

    return (
        <DashboardPage titleKey="dashboard.messages.editTitle">
            <Form {...messages.update.form(message.id)} onError={onError} className="grid gap-3 rounded-xl border p-4">
                <SelectField
                    label={t('dashboard.messages.form.conversation')}
                    name="conversation_id"
                    required
                    defaultValue={String(message.conversation_id)}
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
                    defaultValue={String(message.user_id)}
                    options={users.map((user) => ({
                        value: String(user.id),
                        label: `${user.name} (${user.role})`,
                    }))}
                />
                <TextAreaField
                    label={t('dashboard.messages.form.message')}
                    name="body"
                    required
                    defaultValue={message.body}
                    className="h-36"
                />
                <TextField
                    label={t('dashboard.messages.form.readAt')}
                    name="read_at"
                    type="datetime-local"
                    defaultValue={toDateTimeInput(message.read_at)}
                />
                <Button className="w-fit" type="submit">
                    {t('dashboard.messages.form.update')}
                </Button>
            </Form>
        </DashboardPage>
    );
}

