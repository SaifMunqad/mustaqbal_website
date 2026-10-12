import DashboardPage from '@/components/dashboard/dashboard-page';
import { TextAreaField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, Link, usePage } from '@inertiajs/react';

interface AnswerAuthor {
    id: number;
    name: string;
    role: string;
}

interface MessageAnswer {
    id: number;
    body: string;
    answered_at?: string | null;
    author?: AnswerAuthor | null;
}

interface Message {
    id: number;
    body: string;
    subject?: string | null;
    author?: { name: string } | null;
    sender_name?: string | null;
    sender_email?: string | null;
    sender_phone?: string | null;
    created_at?: string;
    answers: MessageAnswer[];
}

const formatDateTime = (value?: string | null): string => {
    if (!value) return '';
    return new Date(value).toLocaleString();
};

export default function DashboardMessageShow() {
    const { message } = usePage<{ message: Message }>().props;
    const { onError } = useFormToast('Answer recorded and emailed to the sender.');

    const sender = message.sender_name ?? message.author?.name ?? 'Anonymous';

    return (
        <DashboardPage
            titleKey="dashboard.messages.answerTitle"
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Messages', href: '/dashboard/messages' },
            ]}
        >
            <div className="space-y-4">
                <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            {message.subject ?? 'Contact inquiry'}
                        </h2>
                        <Link
                            href="/dashboard/messages"
                            className="text-sm text-blue-600 underline"
                        >
                            Back to list
                        </Link>
                    </div>
                    <dl className="mt-2 grid gap-1 text-sm text-slate-600 dark:text-slate-300">
                        <div>
                            <span className="font-medium">From:</span> {sender}
                        </div>
                        {message.sender_email ? (
                            <div>
                                <span className="font-medium">Email:</span> {message.sender_email}
                            </div>
                        ) : null}
                        {message.sender_phone ? (
                            <div>
                                <span className="font-medium">Phone:</span> {message.sender_phone}
                            </div>
                        ) : null}
                        {message.created_at ? (
                            <div>
                                <span className="font-medium">Received:</span> {formatDateTime(message.created_at)}
                            </div>
                        ) : null}
                    </dl>
                    <p className="mt-3 whitespace-pre-line border-t pt-3">{message.body}</p>
                </div>

                <div className="rounded-xl border p-4">
                    <h3 className="text-base font-semibold">Answers</h3>
                    {message.answers.length ? (
                        <ul className="mt-3 space-y-3">
                            {message.answers.map((answer) => (
                                <li key={answer.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                                    <p className="whitespace-pre-line">{answer.body}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {answer.author?.name ?? 'Management'} · {formatDateTime(answer.answered_at)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-slate-500">No answers yet.</p>
                    )}
                </div>

                <Form
                    action={`/dashboard/messages/${message.id}/answers`}
                    method="post"
                    onError={onError}
                    className="grid gap-3 rounded-xl border p-4"
                >
                    <h3 className="text-base font-semibold">Add an answer</h3>
                    <TextAreaField
                        label="Your reply"
                        name="body"
                        required
                        className="h-36"
                        placeholder="Write a reply. It will be emailed to the sender."
                    />
                    <Button className="w-fit" type="submit">
                        Send answer
                    </Button>
                </Form>
            </div>
        </DashboardPage>
    );
}
