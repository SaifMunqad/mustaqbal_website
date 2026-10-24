/**
 * Edit a dashboard account, including its role and status.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import UserForm, { type UserOption } from '@/components/dashboard/users/user-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import type { User } from '@/types';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface UserEditProps {
    user: User;
    roleOptions: UserOption[];
    statusOptions: UserOption[];
    canDelete: boolean;
    [key: string]: unknown;
}

export default function DashboardUsersEdit() {
    const { t } = useTranslation();
    const { user, roleOptions, statusOptions, canDelete } = usePage<UserEditProps>().props;
    const { onError } = useFormToast(t('dashboard.users.updated'));

    return (
        <DashboardPage titleKey="dashboard.users.editTitle">
            <UserForm
                action={`/dashboard/users/${user.id}`}
                method="patch"
                submitLabel={t('dashboard.users.form.update')}
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
