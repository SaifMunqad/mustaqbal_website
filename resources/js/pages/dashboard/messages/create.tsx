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

export default function DashboardMessagesCreate() {
    const { conversations, users } = usePage<{
        conversations: ConversationOption[];
        users: UserOption[];
    }>().props;
    const { onError } = useFormToast('Message created successfully.');

    return (
        <DashboardPage titleKey="dashboard.messages.createTitle">
            <Form {...messages.store.form()} onError={onError} className="grid gap-3 rounded-xl border p-4">
                <SelectField label="Conversation" name="conversation_id" required>
                    {conversations.map((conversation) => (
                        <option key={conversation.id} value={conversation.id}>
                            {conversation.topic ?? `Conversation ${conversation.id}`}
                        </option>
                    ))}
                </SelectField>
                <SelectField label="Author" name="user_id" required>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                        </option>
                    ))}
                </SelectField>
                <TextAreaField label="Message" name="body" required className="h-36" placeholder="Message" />
                <TextField label="Read at" name="read_at" type="datetime-local" />
                <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white" type="submit">Save</button>
            </Form>
        </DashboardPage>
    );
}

