/**
 * Outermost wrapper for the dashboard layouts.
 *
 * Picks the chrome that matches the layout: the `header` variant is a plain
 * full-height column, while `sidebar` mounts `SidebarProvider` seeded with the
 * server's persisted `sidebarOpen` preference so the collapse state survives
 * navigation.
 */
import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen overflow-hidden w-full flex-col">{children}</div>
        );
    }

    return <SidebarProvider defaultOpen={isOpen}>{children}</SidebarProvider>;
}
