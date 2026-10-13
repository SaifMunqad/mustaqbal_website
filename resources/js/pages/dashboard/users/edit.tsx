import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import type { User } from '@/types';
import { Form, router, usePage } from '@inertiajs/react';

interface UserOption {
    value: string;
    label: string;
}

interface UserEditProps {
    user: User;
    roleOptions: UserOption[];
    statusOptions: UserOption[];
    canDelete: boolean;
    [key: string]: unknown;
}

export default function DashboardUsersEdit() {
    const { user, roleOptions, statusOptions, canDelete } = usePage<UserEditProps>().props;
    const { onError } = useFormToast('Account updated successfully.');

    const removeAccount = () => {
        if (window.confirm(`Delete the account for ${user.email}? This cannot be undone.`)) {
            router.delete(`/dashboard/users/${user.id}`, {
                onSuccess: () => router.visit('/dashboard/users'),
            });
        }
    };

    return (
        <DashboardPage titleKey="dashboard.users.editTitle">
            <Form action={`/dashboard/users/${user.id}`} method="patch" onError={onError} className="space-y-4">
                {({ errors }) => (
                    <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-2">
                        <TextField label="Name" name="name" required defaultValue={user.name} error={errors.name} />
                        <TextField label="Email" name="email" type="email" required defaultValue={user.email} error={errors.email} />
                        <SelectField
                            label="Role"
                            name="role"
                            required
                            defaultValue={user.role}
                            error={errors.role}
                            options={roleOptions}
                        />
                        <SelectField
                            label="Status"
                            name="status"
                            required
                            defaultValue={user.status ?? 'active'}
                            error={errors.status}
                            options={statusOptions}
                        />
                        <TextField
                            label="New password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            error={errors.password}
                            hint="Leave blank to keep the current password."
                        />
                        <TextField
                            label="Confirm password"
                            name="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            error={errors.password_confirmation}
                        />

                        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                            <Button type="submit">Save account</Button>
                            {canDelete ? (
                                <Button type="button" variant="destructive" onClick={removeAccount}>
                                    Delete account
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
