/**
 * Conversation detail: the message, its existing answers, and a form to add a new
 * answer from the dashboard.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { TextAreaField } from '@/components/form/form-fields';
import { Button } from '@/components/ui/button';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { Form, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

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

export default function DashboardMessagesShow() {
    const { t } = useTranslation();
    // Follows the browser-stored calendar preference (Afghan Solar Hijri default).
    const formatDateTime = useDateFormatter({ timeStyle: 'short' }, '');
    const { message } = usePage<{ message: Message }>().props;
    const { onError } = useFormToast(
        t('dashboard.messages.show.answeredToast'),
    );

    const sender =
        message.sender_name ??
        message.author?.name ??
        t('dashboard.messages.show.anonymous');

    return (
        <DashboardPage
            titleKey="dashboard.messages.answerTitle"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                {
                    title: t('dashboard.messages.title'),
                    href: '/dashboard/messages',
                },
            ]}
        >
            <div className="space-y-4">
                <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            {message.subject ??
                                t('dashboard.messages.show.contactInquiry')}
                        </h2>
                        <Link
                            href="/dashboard/messages"
                            className="text-sm text-blue-600 underline"
                        >
                            {t('dashboard.messages.show.back')}
                        </Link>
                    </div>
                    <dl className="mt-2 grid gap-1 text-sm text-slate-600 dark:text-slate-300">
                        <div>
                            <span className="font-medium">
                                {t('dashboard.messages.show.from')}
                            </span>{' '}
                            {sender}
                        </div>
                        {message.sender_email ? (
                            <div>
                                <span className="font-medium">
                                    {t('dashboard.messages.show.email')}
                                </span>{' '}
                                {message.sender_email}
                            </div>
                        ) : null}
                        {message.sender_phone ? (
                            <div>
                                <span className="font-medium">
                                    {t('dashboard.messages.show.phone')}
                                </span>{' '}
                                {message.sender_phone}
                            </div>
                        ) : null}
                        {message.created_at ? (
                            <div>
                                <span className="font-medium">
                                    {t('dashboard.messages.show.received')}
                                </span>{' '}
                                {formatDateTime(message.created_at)}
                            </div>
                        ) : null}
                    </dl>
                    <p className="mt-3 border-t pt-3 whitespace-pre-line">
                        {message.body}
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h3 className="text-base font-semibold">
                        {t('dashboard.messages.show.answers')}
                    </h3>
                    {message.answers.length ? (
                        <ul className="mt-3 space-y-3">
                            {message.answers.map((answer) => (
                                <li
                                    key={answer.id}
                                    className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                                >
                                    <p className="whitespace-pre-line">
                                        {answer.body}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {answer.author?.name ??
                                            t(
                                                'dashboard.messages.show.management',
                                            )}{' '}
                                        · {formatDateTime(answer.answered_at)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-slate-500">
                            {t('dashboard.messages.show.noAnswers')}
                        </p>
                    )}
                </div>

                <Form
                    action={`/dashboard/messages/${message.id}/answers`}
                    method="post"
                    onError={onError}
                    className="grid gap-3 rounded-xl border p-4"
                >
                    <h3 className="text-base font-semibold">
                        {t('dashboard.messages.show.addAnswer')}
                    </h3>
                    <TextAreaField
                        label={t('dashboard.messages.show.reply')}
                        name="body"
                        required
                        className="h-36"
                        placeholder={t(
                            'dashboard.messages.show.replyPlaceholder',
                        )}
                    />
                    <Button className="w-fit" type="submit">
                        {t('dashboard.messages.show.sendAnswer')}
                    </Button>
                </Form>
            </div>
        </DashboardPage>
    );
}
