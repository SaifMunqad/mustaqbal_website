/**
 * Sticky header inside the sidebar layout's scroll region.
 *
 * Holds the sidebar collapse trigger, the current breadcrumb trail and the
 * system-wide calendar preference switcher. The height shrinks in step with the
 * sidebar's icon-collapsed state via the `group-has-data-[collapsible=icon]`
 * variant.
 */
import DateTypeSwitcher from '@/components/general/events/date-type-switcher';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useDateType } from '@/hooks/use-date-type';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    // Calendar preference shared with every date on the dashboard (and the
    // public site); persisted in localStorage so it survives reloads/visits.
    const { dateType, setDateType } = useDateType();

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b border-sidebar-border/50 bg-background px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ms-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ms-auto flex items-center">
                <DateTypeSwitcher value={dateType} onChange={setDateType} />
            </div>
        </header>
    );
}
