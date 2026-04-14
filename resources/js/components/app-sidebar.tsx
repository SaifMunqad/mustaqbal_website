import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    FileText,
    LayoutGrid,
    Mail,
    MessageSquare,
    Newspaper,
    School,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useTranslation();

    const mainNavItems: NavItem[] = [
        {
            title: t('dashboard.tabs.overview'),
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: t('dashboard.tabs.articles'),
            href: '/dashboard/articles',
            icon: Newspaper,
        },
        {
            title: t('dashboard.tabs.posts'),
            href: '/dashboard/posts',
            icon: FileText,
        },
        {
            title: t('dashboard.tabs.contacts'),
            href: '/dashboard/contacts',
            icon: Mail,
        },
        {
            title: t('dashboard.tabs.messages'),
            href: '/dashboard/messages',
            icon: MessageSquare,
        },
        {
            title: t('dashboard.tabs.programs'),
            href: '/dashboard/programs',
            icon: School,
        },
        {
            title: t('dashboard.tabs.pages'),
            href: '/dashboard/site-pages',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" side={document.dir == 'ltr' ? 'left' : 'right'}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
