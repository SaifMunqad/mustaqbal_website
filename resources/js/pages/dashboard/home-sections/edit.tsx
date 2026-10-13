import DashboardPage from '@/components/dashboard/dashboard-page';
import HomeSectionForm, {
    type AvailableItem,
    type HomeSectionFormData,
    type TypeOption,
} from '@/components/dashboard/home-section-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';

interface StoredConfig {
    item_ids?: number[];
    heading?: string;
    body?: string;
    image_url?: string;
    cta_label?: string;
    cta_url?: string;
    tone?: string;
}

interface HomeSectionEditProps {
    section: {
        id: number;
        section_type: string;
        title: string | null;
        limit: number | null;
        is_active: boolean;
        config: StoredConfig;
    };
    typeOptions: TypeOption[];
    availableItems: Record<string, AvailableItem[]>;
    [key: string]: unknown;
}

export default function DashboardHomeSectionEdit() {
    const { section, typeOptions, availableItems } = usePage<HomeSectionEditProps>().props;
    const { onError } = useFormToast('Home section updated.');

    const initial: Partial<HomeSectionFormData> = {
        section_type: section.section_type,
        title: section.title ?? '',
        limit: section.limit != null ? String(section.limit) : '',
        is_active: section.is_active,
        config: {
            item_ids: section.config.item_ids ?? [],
            heading: section.config.heading ?? '',
            body: section.config.body ?? '',
            image_url: section.config.image_url ?? '',
            cta_label: section.config.cta_label ?? '',
            cta_url: section.config.cta_url ?? '',
            tone: section.config.tone ?? 'default',
        },
    };

    return (
        <DashboardPage titleKey="dashboard.homeSections.editTitle">
            <HomeSectionForm
                action={`/dashboard/home-sections/${section.id}`}
                method="put"
                submitLabel="Save changes"
                cancelHref="/dashboard/home-sections"
                typeOptions={typeOptions}
                availableItems={availableItems}
                initial={initial}
                deleteUrl={`/dashboard/home-sections/${section.id}`}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
