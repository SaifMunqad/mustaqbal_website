/**
 * Create a dashboard account. The role and status options are server-provided so
 * the selects can never offer a value the backend would reject.
 */
import DashboardPage from '@/components/dashboard/dashboard-page';
import UserForm, { type UserOption } from '@/components/dashboard/users/user-form';
import { useFormToast } from '@/components/feedback/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface UserCreateProps {
    roleOptions: UserOption[];
    [key: string]: unknown;
}

export default function DashboardUsersCreate() {
    const { t } = useTranslation();
    const { roleOptions } = usePage<UserCreateProps>().props;
    const { onError } = useFormToast(t('dashboard.users.created'));

    return (
        <DashboardPage titleKey="dashboard.users.createTitle">
            <UserForm
                action="/dashboard/users"
                method="post"
                submitLabel={t('dashboard.users.form.save')}
                roleOptions={roleOptions}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
