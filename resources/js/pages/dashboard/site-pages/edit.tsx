import DashboardPage from '@/components/dashboard/dashboard-page';
import SitePageForm, {
    type SitePage,
    type TranslationValues,
} from '@/components/dashboard/site-pages/site-page-form';
import { useFormToast } from '@/components/use-form-toast';
import { usePage } from '@inertiajs/react';
import sitePages from '@/routes/dashboard/site-pages';

export default function DashboardSitePagesEdit() {
    const { page, translations, videoEmbed: initialVideoEmbed } = usePage<{
        page: SitePage;
        translations: TranslationValues;
        videoEmbed?: string;
    }>().props;
    const { onError } = useFormToast('Page updated successfully.');

    return (
        <DashboardPage titleKey="dashboard.pages.editTitle">
            <SitePageForm
                formProps={sitePages.update.form(page.id)}
                submitLabel="Update page"
                cancelHref={sitePages.index.url()}
                page={page}
                translations={translations}
                initialVideoEmbed={initialVideoEmbed}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
