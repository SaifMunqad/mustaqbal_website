import DashboardPage from '@/components/dashboard/dashboard-page';
import UserForm, { type UserOption } from '@/components/dashboard/users/user-form';
import { useFormToast } from '@/components/use-form-toast';
import type { User } from '@/types';
import { usePage } from '@inertiajs/react';

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

    return (
        <DashboardPage titleKey="dashboard.users.editTitle">
            <UserForm
                action={`/dashboard/users/${user.id}`}
                method="patch"
                submitLabel="Save account"
                roleOptions={roleOptions}
                statusOptions={statusOptions}
                user={user}
                canDelete={canDelete}
                deleteUrl={`/dashboard/users/${user.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
