import { Form, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

export interface UserOption {
    value: string;
    label?: string;
    labelKey?: string;
}

// Status choices used on create; edit receives them from the server instead.
const createStatusOptions: UserOption[] = [
    { value: 'active', labelKey: 'enums.userStatus.active' },
    { value: 'pending', labelKey: 'enums.userStatus.pending' },
];

interface UserFormProps {
    action: string;
    method: 'post' | 'patch';
    submitLabel: string;
    roleOptions: UserOption[];
    toastOnError: (errors: Record<string, string>) => void;
    // Present on edit; absent on create so fields render empty and defaults apply.
    user?: User;
    // Status choices come from the server on edit; create uses the defaults.
    statusOptions?: UserOption[];
    // Edit-only: when false the delete action is hidden (e.g. self account).
    canDelete?: boolean;
    deleteUrl?: string;
}

/**
 * Shared create/edit form for user accounts. The two modes differ only in a
 * handful of labels/defaults (password hint, status source, delete action), all
 * derived from whether a `user` record is supplied.
 */
export default function UserForm({
    action,
    method,
    submitLabel,
    roleOptions,
    toastOnError,
    user,
    statusOptions,
    canDelete,
    deleteUrl,
}: UserFormProps) {
    const { t } = useTranslation();
    const isEdit = Boolean(user);

    const removeAccount = () => {
        if (user && window.confirm(t('dashboard.form.deleteAccountTitle', { email: user.email }))) {
            router.delete(`${deleteUrl}`, {
                onSuccess: () => router.visit('/dashboard/users'),
            });
        }
    };

    return (
        <Form action={action} method={method} onError={toastOnError} className="space-y-4">
            {({ errors }) => (
                <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-2">
                    <TextField label={t('dashboard.users.form.name')} name="name" required defaultValue={user?.name ?? ''} placeholder={t('dashboard.users.form.namePlaceholder')} error={errors.name} />
                    <TextField label={t('dashboard.users.form.email')} name="email" type="email" required defaultValue={user?.email ?? ''} placeholder={t('dashboard.users.form.emailPlaceholder')} error={errors.email} />
                    <SelectField
                        label={t('dashboard.users.form.role')}
                        name="role"
                        required
                        defaultValue={user ? user.role : roleOptions[roleOptions.length - 1]?.value}
                        error={errors.role}
                        options={roleOptions}
                    />
                    <SelectField
                        label={t('dashboard.users.form.status')}
                        name="status"
                        required={isEdit}
                        defaultValue={user ? user.status ?? 'active' : 'active'}
                        error={errors.status}
                        options={statusOptions ?? createStatusOptions}
                    />
                    <TextField
                        label={
                            isEdit
                                ? t('dashboard.users.form.newPassword')
                                : t('dashboard.users.form.password')
                        }
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        error={errors.password}
                        hint={
                            isEdit
                                ? t('dashboard.users.form.passwordHintEdit')
                                : t('dashboard.users.form.passwordHintCreate')
                        }
                    />
                    <TextField
                        label={t('dashboard.users.form.confirmPassword')}
                        name="password_confirmation"
                        type="password"
                        autoComplete="new-password"
                        error={errors.password_confirmation}
                    />

                    {isEdit ? (
                        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                            <Button type="submit">{submitLabel}</Button>
                            {canDelete ? (
                                <Button type="button" variant="destructive" onClick={removeAccount}>
                                    {t('dashboard.users.form.delete')}
                                </Button>
                            ) : null}
                        </div>
                    ) : (
                        <div className="md:col-span-2">
                            <Button type="submit">{submitLabel}</Button>
                        </div>
                    )}
                </div>
            )}
        </Form>
    );
}
