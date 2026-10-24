import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import settings from '@/routes/dashboard/whatsapp-settings';
import campaigns from '@/routes/dashboard/whatsapp-campaigns';
import { Form, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Setting {
    phone_number_id?: string | null;
    business_account_id?: string | null;
    graph_version?: string | null;
    is_active: boolean;
    has_token: boolean;
}

export default function DashboardWhatsAppSettingsEdit() {
    const { t } = useTranslation();
    const { setting, configured, source } = usePage<{
        setting: Setting;
        configured: boolean;
        source: 'database' | 'env' | 'none';
    }>().props;
    const { onError } = useFormToast(t('dashboard.whatsappSettings.updated'));

    return (
        <DashboardPage
            titleKey="dashboard.whatsappSettings.title"
            breadcrumbs={[
                { title: t('dashboard.title'), href: '/dashboard' },
                {
                    title: t('dashboard.whatsappCampaigns.title'),
                    href: campaigns.index.url(),
                },
            ]}
        >
            <div
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4 ${
                    configured
                        ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
                }`}
            >
                <div className="flex items-center gap-2">
                    {configured ? (
                        <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                    ) : (
                        <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="text-sm font-medium">
                        {configured
                            ? source === 'env'
                                ? t(
                                      'dashboard.whatsappSettings.form.configuredEnv',
                                  )
                                : t(
                                      'dashboard.whatsappSettings.form.configured',
                                  )
                            : t(
                                  'dashboard.whatsappSettings.form.notConfigured',
                              )}
                    </span>
                </div>
                <Link href={campaigns.index.url()} className="text-sm text-blue-600 underline">
                    {t('dashboard.whatsappSettings.form.backToCampaigns')}
                </Link>
            </div>

            <Form {...settings.update.form()} onError={onError} className="grid max-w-2xl gap-4 rounded-xl border p-4">
                <TextField
                    label={t('dashboard.whatsappSettings.form.accessToken')}
                    name="access_token"
                    type="password"
                    autoComplete="off"
                    placeholder={
                        setting.has_token
                            ? t(
                                  'dashboard.whatsappSettings.form.accessTokenSavedPlaceholder',
                              )
                            : 'EAAG...'
                    }
                    hint={
                        setting.has_token
                            ? t(
                                  'dashboard.whatsappSettings.form.accessTokenSavedHint',
                              )
                            : t(
                                  'dashboard.whatsappSettings.form.accessTokenHint',
                              )
                    }
                />
                <TextField
                    label={t('dashboard.whatsappSettings.form.phoneNumberId')}
                    name="phone_number_id"
                    defaultValue={setting.phone_number_id ?? ''}
                    placeholder={t(
                        'dashboard.whatsappSettings.form.phoneNumberIdPlaceholder',
                    )}
                    hint={t(
                        'dashboard.whatsappSettings.form.phoneNumberIdHint',
                    )}
                />
                <TextField
                    label={t(
                        'dashboard.whatsappSettings.form.businessAccountId',
                    )}
                    name="business_account_id"
                    defaultValue={setting.business_account_id ?? ''}
                    placeholder={t(
                        'dashboard.whatsappSettings.form.businessAccountIdPlaceholder',
                    )}
                    hint={t(
                        'dashboard.whatsappSettings.form.businessAccountIdHint',
                    )}
                />
                <TextField
                    label={t('dashboard.whatsappSettings.form.graphVersion')}
                    name="graph_version"
                    defaultValue={setting.graph_version ?? 'v23.0'}
                    placeholder="v23.0"
                />
                <SelectField
                    label={t('dashboard.whatsappSettings.form.status')}
                    name="is_active"
                    defaultValue={setting.is_active ? '1' : '0'}
                    options={[
                        {
                            value: '1',
                            label: t(
                                'dashboard.whatsappSettings.form.enabled',
                            ),
                        },
                        {
                            value: '0',
                            label: t(
                                'dashboard.whatsappSettings.form.disabled',
                            ),
                        },
                    ]}
                    hint={t('dashboard.whatsappSettings.form.statusHint')}
                />
                <Button className="w-fit" type="submit">
                    {t('dashboard.whatsappSettings.form.save')}
                </Button>
            </Form>

            <Form
                {...settings.test.form()}
                className="w-fit"
                preserveScroll
                onSuccess={() => undefined}
            >
                <Button type="submit" variant="outline">
                    {t('dashboard.whatsappSettings.form.test')}
                </Button>
            </Form>
        </DashboardPage>
    );
}
