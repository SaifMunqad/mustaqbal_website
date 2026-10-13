import DashboardPage from '@/components/dashboard/dashboard-page';
import HomeSectionForm, {
    type AvailableItem,
    type TypeOption,
} from '@/components/dashboard/home-section-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface Props {
    typeOptions: TypeOption[];
    availableItems: Record<string, AvailableItem[]>;
    [key: string]: unknown;
}

export default function DashboardHomeSectionCreate() {
    const { typeOptions, availableItems } = usePage<Props>().props;
    const { onError } = useFormToast('Home section added.');

    return (
        <DashboardPage titleKey="dashboard.homeSections.createTitle">
            <HomeSectionForm
                action="/dashboard/home-sections"
                method="post"
                submitLabel="Add section"
                cancelHref="/dashboard/home-sections"
                typeOptions={typeOptions}
                availableItems={availableItems}
                initial={{}}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
