/**
 * Dashboard view for a single enrollment enquiry.
 *
 * Shows the family's submitted details, every recorded reply, a triage status
 * selector, and a reply composer. The message is written with the same rich-text
 * editor used across the admin (headings, paragraphs, alignment, direction, …)
 * and the composed HTML is emailed to the guardian exactly as written. Opening a
 * still-new enquiry flips it to "reviewed" on the server before render.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { filterSelectClass } from '@/components/dashboard/resource-filter-bar';
import RichTextEditor from '@/components/editor/rich-text-editor';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { TextField } from '@/components/form/form-fields';
import { Button } from '@/components/ui/button';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ReplyAuthor {
    id: number;
    name: string;
    role: string;
}

interface Reply {
    id: number;
    subject?: string | null;
    body: string;
    replied_at?: string | null;
    author?: ReplyAuthor | null;
}

interface EnrollmentDetail {
    id: number;
    student_name: string;
    guardian_name: string;
    email: string;
    phone: string;
    grade: string;
    status: string;
    date_of_birth?: string | null;
    address?: string | null;
    notes?: string | null;
    prefers_email_updates: boolean;
    replies: Reply[];
    created_at: string;
}

interface StatusOption {
    value: string;
    label: string;
    labelKey: string;
}

interface EnrollmentShowProps {
    enrollment: EnrollmentDetail;
    statuses: StatusOption[];
    [key: string]: unknown;
}

interface ReplyForm {
    subject: string;
    body: string;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
    if (!value) {
        return null;
    }
    return (
        <p className="text-sm">
            <span className="font-medium">{label}:</span> {value}
        </p>
    );
}

export default function DashboardEnrollmentShow() {
    const { enrollment, statuses } = usePage<EnrollmentShowProps>().props;
    const { t } = useTranslation();
    // Follow the browser-stored calendar preference (Afghan Solar Hijri default).
    const formatDate = useDateFormatter({}, '');
    const formatDateTime = useDateFormatter({ timeStyle: 'short' }, '');
    const [status, setStatus] = useState(enrollment.status);
    const [dir, setDir] = useState<'rtl' | 'ltr'>('ltr');
    // The server flashes the success toast, so only failures are handled here.
    const { onError } = useFormToast(t('flash.enrollmentAnswered'));

    const { data, setData, post, processing, errors } = useForm<ReplyForm>({
        subject: t('dashboard.enrollments.show.defaultSubject'),
        body: '',
    });

    const submitReply = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(`/dashboard/enrollments/${enrollment.id}/replies`, {
            preserveScroll: true,
            onError,
            onSuccess: () => setData('body', ''),
        });
    };

    return (
        <DashboardPage
            titleKey="dashboard.enrollments.title"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                {
                    title: t('dashboard.enrollments.title'),
                    href: '/dashboard/enrollments',
                },
            ]}
            actions={
                <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/enrollments">
                        {t('dashboard.enrollments.back')}
                    </Link>
                </Button>
            }
        >
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-bold">
                            {enrollment.student_name}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {t('dashboard.enrollments.submittedOn')}:{' '}
                            {formatDate(enrollment.created_at)}
                        </span>
                    </div>

                    <div className="grid gap-1">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            {t('dashboard.enrollments.sections.student')}
                        </h3>
                        <Detail
                            label={t('dashboard.enrollments.fields.grade')}
                            value={enrollment.grade}
                        />
                        <Detail
                            label={t(
                                'dashboard.enrollments.fields.dateOfBirth',
                            )}
                            value={
                                enrollment.date_of_birth
                                    ? formatDate(enrollment.date_of_birth)
                                    : null
                            }
                        />
                    </div>

                    <div className="grid gap-1">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            {t('dashboard.enrollments.sections.guardian')}
                        </h3>
                        <Detail
                            label={t(
                                'dashboard.enrollments.fields.guardianName',
                            )}
                            value={enrollment.guardian_name}
                        />
                        <Detail
                            label={t('dashboard.enrollments.fields.email')}
                            value={enrollment.email}
                        />
                        <Detail
                            label={t('dashboard.enrollments.fields.phone')}
                            value={enrollment.phone}
                        />
                        <p className="text-sm text-muted-foreground">
                            {enrollment.prefers_email_updates
                                ? t('dashboard.enrollments.show.yesOpted')
                                : t('dashboard.enrollments.show.noOpted')}
                        </p>
                    </div>

                    <div className="grid gap-1">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                            {t('dashboard.enrollments.sections.details')}
                        </h3>
                        <p className="text-sm whitespace-pre-line">
                            {enrollment.address}
                        </p>
                        <p className="text-sm whitespace-pre-line text-muted-foreground">
                            {enrollment.notes ||
                                t('dashboard.enrollments.show.noNotes')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {t('dashboard.enrollments.markStatus')}:
                        </span>
                        <select
                            value={status}
                            onChange={(event) => {
                                const next = event.target.value;
                                setStatus(next);
                                router.put(
                                    `/dashboard/enrollments/${enrollment.id}/status`,
                                    { status: next },
                                    { preserveScroll: true },
                                );
                            }}
                            className={filterSelectClass}
                        >
                            {statuses.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {t(option.labelKey, option.label)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border p-4">
                        <h3 className="text-base font-semibold">
                            {t('dashboard.enrollments.show.replies')}
                        </h3>
                        {enrollment.replies.length ? (
                            <ul className="mt-3 space-y-3">
                                {enrollment.replies.map((reply) => (
                                    <li
                                        key={reply.id}
                                        className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                                    >
                                        {reply.subject ? (
                                            <p className="mb-1 text-sm font-semibold">
                                                {reply.subject}
                                            </p>
                                        ) : null}
                                        {/* Stored body is sanitized TipTap HTML. */}
                                        <div
                                            className="text-sm [&_a]:text-blue-600 [&_a]:underline [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ps-5"
                                            dangerouslySetInnerHTML={{
                                                __html: reply.body,
                                            }}
                                        />
                                        <p className="mt-1 text-xs text-slate-500">
                                            {reply.author?.name ??
                                                t(
                                                    'dashboard.enrollments.show.management',
                                                )}{' '}
                                            · {formatDateTime(reply.replied_at)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-sm text-slate-500">
                                {t('dashboard.enrollments.show.noReplies')}
                            </p>
                        )}
                    </div>

                    <form
                        onSubmit={submitReply}
                        className="grid gap-3 rounded-xl border p-4"
                    >
                        <h3 className="text-base font-semibold">
                            {t('dashboard.enrollments.show.addReply')}
                        </h3>
                        <TextField
                            label={t('dashboard.enrollments.show.subject')}
                            value={data.subject}
                            onChange={(event) =>
                                setData('subject', event.target.value)
                            }
                            placeholder={t(
                                'dashboard.enrollments.show.subjectPlaceholder',
                            )}
                            error={errors.subject}
                        />

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    {t('dashboard.enrollments.show.message')}
                                </span>
                                {/* Writing direction toggle for the editor. */}
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t(
                                            'dashboard.enrollments.show.direction',
                                        )}
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            dir === 'ltr'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() => setDir('ltr')}
                                    >
                                        {t(
                                            'dashboard.enrollments.show.directionLTR',
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            dir === 'rtl'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() => setDir('rtl')}
                                    >
                                        {t(
                                            'dashboard.enrollments.show.directionRTL',
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <RichTextEditor
                                name="body"
                                value={data.body}
                                onChange={(html) => setData('body', html)}
                                dir={dir}
                                allowChart={false}
                                placeholder={t(
                                    'dashboard.enrollments.show.replyPlaceholder',
                                )}
                            />
                            {errors.body ? (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.body}
                                </p>
                            ) : null}
                        </div>

                        <Button
                            className="w-fit"
                            type="submit"
                            disabled={processing}
                        >
                            {t('dashboard.enrollments.show.sendReply')}
                        </Button>
                    </form>
                </div>
            </div>
        </DashboardPage>
    );
}
