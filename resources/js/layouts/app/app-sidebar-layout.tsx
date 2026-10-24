/**
 * Sidebar-variant dashboard shell.
 *
 * The content column is the single scroll region — not the document — so the thin
 * scrollbar runs the full height and the sidebar header can stay sticky inside
 * it. This is the shape the RTL scrollbar behaviour was tuned against.
 */
import { AppContent } from '@/components/layout/app-content';
import { AppShell } from '@/components/layout/app-shell';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppSidebarHeader } from '@/components/layout/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                {/* Single scroll region so the thin scrollbar runs the full
                    height from the top; the header inside it is sticky. */}
                <div className="scrollbar-thin overflow-hidden min-h-0 flex-1 overflow-y-auto">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
