/**
 * Sticky header inside the sidebar layout's scroll region.
 *
 * Holds the sidebar collapse trigger and the current breadcrumb trail. The
 * height shrinks in step with the sidebar's icon-collapsed state via the
 * `group-has-data-[collapsible=icon]` variant.
 */
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b border-sidebar-border/50 bg-background px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ms-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
