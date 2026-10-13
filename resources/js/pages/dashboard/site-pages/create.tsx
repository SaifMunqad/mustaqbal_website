import DashboardPage from '@/components/dashboard/dashboard-page';
import SitePageForm from '@/components/dashboard/site-pages/site-page-form';
import { useFormToast } from '@/components/use-form-toast';
import sitePages from '@/routes/dashboard/site-pages';

export default function DashboardSitePagesCreate() {
    const { onError } = useFormToast('Page created successfully.');

    return (
        <DashboardPage titleKey="dashboard.pages.createTitle">
            <SitePageForm
                formProps={sitePages.store.form()}
                submitLabel="Save page"
                cancelHref={sitePages.index.url()}
                toastOnError={onError}
            />
        </DashboardPage>
    );
}
