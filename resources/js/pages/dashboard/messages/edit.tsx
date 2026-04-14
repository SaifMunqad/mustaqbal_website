import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';
import messages from '@/routes/dashboard/messages';

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
    const { message, conversations, users } = usePage<{
        message: Message;
        conversations: ConversationOption[];
        users: UserOption[];
    }>().props;
    const { onError } = useFormToast('Message updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.messages.editTitle">
            <Form {...messages.update.form(message.id)} onError={onError} className="grid gap-3 rounded-xl border p-4">
                <SelectField label="Conversation" name="conversation_id" required defaultValue={String(message.conversation_id)}>
                    {conversations.map((conversation) => (
                        <option key={conversation.id} value={conversation.id}>
                            {conversation.topic ?? `Conversation ${conversation.id}`}
                        </option>
                    ))}
                </SelectField>
                <SelectField label="Author" name="user_id" required defaultValue={String(message.user_id)}>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                        </option>
                    ))}
                </SelectField>
                <TextAreaField label="Message" name="body" required defaultValue={message.body} className="h-36" />
                <TextField label="Read at" name="read_at" type="datetime-local" defaultValue={toDateTimeInput(message.read_at)} />
                <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white" type="submit">Update</button>
            </Form>
        </DashboardPage>
    );
}

