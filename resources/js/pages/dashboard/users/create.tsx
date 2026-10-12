import DashboardPage from '@/components/dashboard/dashboard-page';
import { SelectField, TextField } from '@/components/form-fields';
import { Button } from '@/components/ui/button';
import { useFormToast } from '@/components/use-form-toast';
import { Form, usePage } from '@inertiajs/react';

interface Option {
    value: string;
    label: string;
}

interface Props {
    roleOptions: Option[];
    [key: string]: unknown;
}

export default function DashboardUsersCreate() {
    const { roleOptions } = usePage<Props>().props;
    const { onError } = useFormToast('Account created successfully.');

    return (
        <DashboardPage titleKey="dashboard.users.createTitle">
            <Form action="/dashboard/users" method="post" onError={onError} className="space-y-4">
                {({ errors }) => (
                    <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-2">
                        <TextField label="Name" name="name" required error={errors.name} placeholder="Full name" />
                        <TextField label="Email" name="email" type="email" required error={errors.email} placeholder="email@example.com" />
                        <SelectField
                            label="Role"
                            name="role"
                            required
                            defaultValue={roleOptions[roleOptions.length - 1]?.value}
                            error={errors.role}
                            options={roleOptions}
                        />
                        <SelectField
                            label="Status"
                            name="status"
                            defaultValue="active"
                            error={errors.status}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'pending', label: 'Pending' },
                            ]}
                        />
                        <TextField
                            label="Password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            error={errors.password}
                            hint="Leave blank to email a password setup link instead."
                        />
                        <TextField
                            label="Confirm password"
                            name="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            error={errors.password_confirmation}
                        />

                        <div className="md:col-span-2">
                            <Button type="submit">Create account</Button>
                        </div>
                    </div>
                )}
            </Form>
        </DashboardPage>
    );
}
