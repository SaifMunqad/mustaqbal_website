import DashboardPage from '@/components/dashboard/dashboard-page';
import HomeSectionForm, {
    type AvailableItem,
    type TypeOption,
} from '@/components/dashboard/home-section-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface HomeSectionCreateProps {
    typeOptions: TypeOption[];
    availableItems: Record<string, AvailableItem[]>;
    [key: string]: unknown;
}

export default function DashboardHomeSectionCreate() {
    const { t } = useTranslation();
    const { typeOptions, availableItems } = usePage<HomeSectionCreateProps>().props;
    const { onError } = useFormToast(t('dashboard.homeSections.created'));

    return (
        <DashboardPage titleKey="dashboard.homeSections.createTitle">
            <HomeSectionForm
                action="/dashboard/home-sections"
                method="post"
                submitLabel={t('dashboard.homeSections.add')}
                cancelHref="/dashboard/home-sections"
                typeOptions={typeOptions}
                availableItems={availableItems}
                initial={{}}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
