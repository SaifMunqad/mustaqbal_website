import DashboardPage from '@/components/dashboard/dashboard-page';
import UserForm, { type UserOption } from '@/components/dashboard/users/user-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface UserCreateProps {
    roleOptions: UserOption[];
    [key: string]: unknown;
}

export default function DashboardUsersCreate() {
    const { roleOptions } = usePage<UserCreateProps>().props;
    const { onError } = useFormToast('Account created successfully.');

    return (
        <DashboardPage titleKey="dashboard.users.createTitle">
            <UserForm
                action="/dashboard/users"
                method="post"
                submitLabel="Create account"
                roleOptions={roleOptions}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
