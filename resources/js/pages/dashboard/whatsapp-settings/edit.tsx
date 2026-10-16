import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import settings from '@/routes/dashboard/whatsapp-settings';
import campaigns from '@/routes/dashboard/whatsapp-campaigns';
import { Form, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Setting {
    phone_number_id?: string | null;
    business_account_id?: string | null;
    graph_version?: string | null;
    is_active: boolean;
    has_token: boolean;
}

export default function DashboardWhatsAppSettingsEdit() {
    const { setting, configured, source } = usePage<{
        setting: Setting;
        configured: boolean;
        source: 'database' | 'env' | 'none';
    }>().props;
    const { onError } = useFormToast('WhatsApp settings saved.');

    return (
        <DashboardPage
            titleKey="dashboard.whatsappSettings.title"
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Bulk WhatsApp', href: campaigns.index.url() },
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
                            ? `WhatsApp is configured${
                                  source === 'env'
                                      ? ' from the server environment (.env).'
                                      : ' and ready to send.'
                              }`
                            : 'WhatsApp is not configured yet. Add your Meta Cloud API credentials below.'}
                    </span>
                </div>
                <Link href={campaigns.index.url()} className="text-sm text-blue-600 underline">
                    Back to campaigns
                </Link>
            </div>

            <Form {...settings.update.form()} onError={onError} className="grid max-w-2xl gap-4 rounded-xl border p-4">
                <TextField
                    label="Access token"
                    name="access_token"
                    type="password"
                    autoComplete="off"
                    placeholder={setting.has_token ? '•••••••• (saved — enter a new one only to replace)' : 'EAAG...'}
                    hint={
                        setting.has_token
                            ? 'A token is already stored (encrypted). Leave this blank to keep it; paste a new one to replace it.'
                            : 'The permanent access token from your Meta WhatsApp Business app (System User token recommended).'
                    }
                />
                <TextField
                    label="Phone number ID"
                    name="phone_number_id"
                    defaultValue={setting.phone_number_id ?? ''}
                    placeholder="123456789012345"
                    hint="The WhatsApp Cloud API phone number id (not the phone number itself) — found in your Meta app's API setup."
                />
                <TextField
                    label="Business account ID (optional)"
                    name="business_account_id"
                    defaultValue={setting.business_account_id ?? ''}
                    placeholder="987654321098765"
                    hint="Only needed if you plan to manage templates through the app; sending works without it."
                />
                <TextField
                    label="Graph API version"
                    name="graph_version"
                    defaultValue={setting.graph_version ?? 'v23.0'}
                    placeholder="v23.0"
                />
                <SelectField
                    label="Status"
                    name="is_active"
                    defaultValue={setting.is_active ? '1' : '0'}
                    options={[
                        { value: '1', label: 'Enabled' },
                        { value: '0', label: 'Disabled' },
                    ]}
                    hint="When disabled, campaigns can no longer be sent even if credentials remain saved."
                />
                <Button className="w-fit" type="submit">
                    Save settings
                </Button>
            </Form>

            <Form
                {...settings.test.form()}
                className="w-fit"
                preserveScroll
                onSuccess={() => undefined}
            >
                <Button type="submit" variant="outline">
                    Test connection
                </Button>
            </Form>
        </DashboardPage>
    );
}
