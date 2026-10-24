import DashboardPage from '@/components/dashboard/dashboard-page';
import { CheckboxField } from '@/components/form-fields';
import FormSection from '@/components/form/form-section';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { useFormToast } from '@/components/use-form-toast';
import { Button } from '@/components/ui/button';
import { EyeIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface AboutPage {
    id: number;
    slug: string;
    is_published: boolean;
}

interface Props {
    page: AboutPage;
    visualUrl: string;
    [key: string]: unknown;
}

interface FormShape {
    is_published: boolean;
}

/**
 * Settings screen for the public About page. Content (hero, story, stats,
 * values, message, FAQ…) is authored in the unified page builder, so this
 * screen only owns publishing — there is exactly one content editor and no
 * chance of two screens overwriting each other.
 */
export default function DashboardAboutEdit() {
    const { t } = useTranslation();
    const { page, visualUrl } = usePage<Props>().props;
    // Success is announced by the server flash so the toast never duplicates.
    const { onError } = useFormToast(t('flash.aboutUpdated'));

    const form = useForm<FormShape>({
        is_published: page.is_published,
    });

    return (
        <DashboardPage
            titleKey="dashboard.about.title"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                { title: t('dashboard.about.title'), href: '/dashboard/about' },
            ]}
            actions={
                <Button asChild size="sm">
                    <Link href={visualUrl}>{t('homeBuilder.visualEditor')}</Link>
                </Button>
            }
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit('put', '/dashboard/about', {
                        preserveScroll: true,
                        onError,
                    });
                }}
                className="space-y-4"
            >
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center gap-2">
                                <EyeIcon className="size-5 text-blue-600" />
                                <span className="text-sm font-semibold">
                                    {t('dashboard.about.contentInEditor')}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t('dashboard.about.contentInEditorHint')}
                            </p>
                            <Button asChild size="sm" className="mt-4">
                                <Link href={visualUrl}>
                                    {t('homeBuilder.visualEditor')}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <FormSection
                            title={t('dashboard.about.publishing')}
                            icon={<RocketLaunchIcon className="size-5" />}
                        >
                            <CheckboxField
                                label={t('dashboard.form.published')}
                                name="is_published"
                                checked={form.data.is_published}
                                onCheckedChange={(checked) =>
                                    form.setData(
                                        'is_published',
                                        checked === true,
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('dashboard.about.publishHint')}
                            </p>
                        </FormSection>
                    </aside>
                </div>

                <StickyFormFooter
                    submitLabel={t('dashboard.form.saveChanges')}
                    processing={form.processing}
                />
            </form>
        </DashboardPage>
    );
}
