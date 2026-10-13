import { Form, router } from '@inertiajs/react';
import { SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

export interface UserOption {
    value: string;
    label: string;
}

// Status choices used on create; edit receives them from the server instead.
const createStatusOptions: UserOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
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
    const isEdit = Boolean(user);

    const removeAccount = () => {
        if (user && window.confirm(`Delete the account for ${user.email}? This cannot be undone.`)) {
            router.delete(`${deleteUrl}`, {
                onSuccess: () => router.visit('/dashboard/users'),
            });
        }
    };

    return (
        <Form action={action} method={method} onError={toastOnError} className="space-y-4">
            {({ errors }) => (
                <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-2">
                    <TextField label="Name" name="name" required defaultValue={user?.name ?? ''} placeholder="Full name" error={errors.name} />
                    <TextField label="Email" name="email" type="email" required defaultValue={user?.email ?? ''} placeholder="email@example.com" error={errors.email} />
                    <SelectField
                        label="Role"
                        name="role"
                        required
                        defaultValue={user ? user.role : roleOptions[roleOptions.length - 1]?.value}
                        error={errors.role}
                        options={roleOptions}
                    />
                    <SelectField
                        label="Status"
                        name="status"
                        required={isEdit}
                        defaultValue={user ? user.status ?? 'active' : 'active'}
                        error={errors.status}
                        options={statusOptions ?? createStatusOptions}
                    />
                    <TextField
                        label={isEdit ? 'New password' : 'Password'}
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        error={errors.password}
                        hint={isEdit ? 'Leave blank to keep the current password.' : 'Leave blank to email a password setup link instead.'}
                    />
                    <TextField
                        label="Confirm password"
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
                                    Delete account
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
