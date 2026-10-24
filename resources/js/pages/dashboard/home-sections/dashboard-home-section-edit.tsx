import DashboardPage from '@/components/dashboard/dashboard-page';
import HomeSectionForm, {
    type AvailableItem,
    type HomeSectionFormData,
    type TypeOption,
} from '@/components/dashboard/home-section-form';
import type { TranslationValues } from '@/components/language-tabs-editor';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface StoredConfig {
    item_ids?: number[];
    image_url?: string;
    cta_url?: string;
    tone?: string;
}

interface HomeSectionEditProps {
    section: {
        id: number;
        section_type: string;
        limit: number | null;
        is_active: boolean;
        config: StoredConfig;
    };
    translations: TranslationValues;
    typeOptions: TypeOption[];
    availableItems: Record<string, AvailableItem[]>;
    [key: string]: unknown;
}

export default function DashboardHomeSectionEdit() {
    const { t } = useTranslation();
    const { section, translations, typeOptions, availableItems } =
        usePage<HomeSectionEditProps>().props;
    const { onError } = useFormToast(t('dashboard.homeSections.updated'));

    const initial: Partial<HomeSectionFormData> = {
        section_type: section.section_type,
        limit: section.limit != null ? String(section.limit) : '',
        is_active: section.is_active,
        config: {
            item_ids: section.config.item_ids ?? [],
            image_url: section.config.image_url ?? '',
            cta_url: section.config.cta_url ?? '',
            tone: section.config.tone ?? 'default',
        },
        translations,
    };

    return (
        <DashboardPage titleKey="dashboard.homeSections.editTitle">
            <HomeSectionForm
                action={`/dashboard/home-sections/${section.id}`}
                method="put"
                submitLabel={t('dashboard.homeSections.save')}
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
