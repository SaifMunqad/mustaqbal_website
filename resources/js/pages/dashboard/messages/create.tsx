import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextAreaField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
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
                <SelectField
                    label="Conversation"
                    name="conversation_id"
                    required
                    options={conversations.map((conversation) => ({
                        value: String(conversation.id),
                        label: conversation.topic ?? `Conversation ${conversation.id}`,
                    }))}
                />
                <SelectField
                    label="Author"
                    name="user_id"
                    required
                    options={users.map((user) => ({
                        value: String(user.id),
                        label: `${user.name} (${user.role})`,
                    }))}
                />
                <TextAreaField label="Message" name="body" required className="h-36" placeholder="Message" />
                <TextField label="Read at" name="read_at" type="datetime-local" />
                <Button className="w-fit" type="submit">
                    Save
                </Button>
            </Form>
        </DashboardPage>
    );
}

