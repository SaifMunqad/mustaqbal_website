/**
 * Dashboard view for a single job application.
 *
 * Shows the candidate's full details, the submitted documents (downloaded
 * through a management-only route, since they live on the private disk) and a
 * status selector. Opening a pending application already flips it to "read" on
 * the server side, before this page ever renders.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import { filterSelectClass } from '@/components/dashboard/resource-filter-bar';
import { Button } from '@/components/ui/button';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DocumentRow {
    id: number;
    original_name: string;
    mime_type?: string | null;
    size: number;
    created_at: string;
}

interface ApplicationDetail {
    id: number;
    full_name: string;
    first_name: string;
    last_name: string;
    father_name: string;
    email: string;
    phone: string;
    city?: string | null;
    address?: string | null;
    experience: string;
    cover_letter?: string | null;
    status: string;
    job_id: number;
    job_title?: string | null;
    applicant_user?: string | null;
    documents: DocumentRow[];
    created_at: string;
}

interface StatusOption {
    value: string;
    label: string;
    labelKey: string;
}

interface JobApplicationShowProps {
    application: ApplicationDetail;
    statuses: StatusOption[];
    [key: string]: unknown;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DashboardJobApplicationShow() {
    const { application, statuses } = usePage<JobApplicationShowProps>().props;
    const { t } = useTranslation();
    // Follows the browser-stored calendar preference (Afghan Solar Hijri default).
    const formatDate = useDateFormatter();
    const [status, setStatus] = useState(application.status);

    return (
        <DashboardPage
            titleKey="dashboard.jobApplications.title"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                { title: t('dashboard.tabs.jobs'), href: '/dashboard/jobs' },
                {
                    title: t('dashboard.jobApplications.title'),
                    href: '/dashboard/jobs/applications',
                },
            ]}
            actions={
                <Button asChild size="sm" variant="outline">
                    <Link
                        href={`/dashboard/jobs/${application.job_id}/applications`}
                    >
                        {t('dashboard.jobApplications.back')}
                    </Link>
                </Button>
            }
        >
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-bold">
                            {application.full_name}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {t('dashboard.jobApplications.submittedOn')}:{' '}
                            {formatDate(application.created_at)}
                        </span>
                    </div>

                    <div className="grid gap-2 text-sm">
                        <p>
                            <span className="font-medium">
                                {t('dashboard.jobApplications.appliedFor')}:
                            </span>{' '}
                            {application.job_title ?? '-'}
                        </p>
                        <p>
                            <span className="font-medium">
                                {t(
                                    'dashboard.jobApplications.fields.fatherName',
                                )}
                                :
                            </span>{' '}
                            {application.father_name}
                        </p>
                        <p>
                            <span className="font-medium">
                                {t('dashboard.jobApplications.fields.email')}:
                            </span>{' '}
                            {application.email}
                        </p>
                        <p>
                            <span className="font-medium">
                                {t('dashboard.jobApplications.fields.phone')}:
                            </span>{' '}
                            {application.phone}
                        </p>
                        {application.city ? (
                            <p>
                                <span className="font-medium">
                                    {t('dashboard.jobApplications.fields.city')}
                                    :
                                </span>{' '}
                                {application.city}
                            </p>
                        ) : null}
                        {application.address ? (
                            <p>
                                <span className="font-medium">
                                    {t(
                                        'dashboard.jobApplications.fields.address',
                                    )}
                                    :
                                </span>{' '}
                                {application.address}
                            </p>
                        ) : null}
                        {application.applicant_user ? (
                            <p className="text-muted-foreground">
                                {application.applicant_user}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {t('dashboard.jobApplications.markStatus')}:
                        </span>
                        <select
                            value={status}
                            onChange={(event) => {
                                const next = event.target.value;
                                setStatus(next);
                                router.put(
                                    `/dashboard/applications/${application.id}/status`,
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

                <div className="space-y-4 rounded-xl border p-4">
                    <div>
                        <h3 className="text-sm font-semibold">
                            {t('dashboard.jobApplications.experience')}
                        </h3>
                        <p className="mt-1 text-sm whitespace-pre-line">
                            {application.experience}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">
                            {t('dashboard.jobApplications.coverLetter')}
                        </h3>
                        <p className="mt-1 text-sm whitespace-pre-line">
                            {application.cover_letter ||
                                t('dashboard.jobApplications.noCoverLetter')}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">
                            {t('dashboard.jobApplications.documents')}
                        </h3>
                        {application.documents.length === 0 ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('dashboard.jobApplications.noDocuments')}
                            </p>
                        ) : (
                            <ul className="mt-2 space-y-2">
                                {application.documents.map((document) => (
                                    <li
                                        key={document.id}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <span className="truncate">
                                            {document.original_name}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-3">
                                            <span className="text-xs text-muted-foreground">
                                                {formatBytes(document.size)}
                                            </span>
                                            <a
                                                href={`/dashboard/applications/documents/${document.id}/download`}
                                                className="text-blue-600 underline"
                                            >
                                                {t(
                                                    'dashboard.jobApplications.download',
                                                )}
                                            </a>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </DashboardPage>
    );
}
