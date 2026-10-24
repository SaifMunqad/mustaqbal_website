// Components
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { translateAuthStatus } from '@/i18n';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();
    const statusMessage = translateAuthStatus(status, t);

    return (
        <AuthLayout
            title={t('auth.forgotPassword.title')}
            description={t('auth.forgotPassword.description')}
        >
            <Head title={t('auth.forgotPassword.title')} />

            {statusMessage && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {statusMessage}
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('auth.emailAddress')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder={t('auth.emailPlaceholder')}
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    {t('auth.forgotPassword.submit')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="inline-flex flex-wrap items-center justify-center gap-1 text-center text-sm text-muted-foreground">
                    <span>{t('auth.forgotPassword.backToLogin')}</span>
                    <TextLink href={login()}>
                        {t('auth.forgotPassword.loginLink')}
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
