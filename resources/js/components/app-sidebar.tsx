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
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarDays,
    Coins,
    FileText,
    Folder,
    Globe,
    LayoutGrid,
    Library,
    Mail,
    MessageSquare,
    Newspaper,
    School,
    Settings,
    Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const canManageUsers = ['admin', 'management'].includes(auth.user?.role ?? '');
    const isAdmin = auth.user?.role === 'admin';

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
            title: t('dashboard.tabs.events'),
            href: '/dashboard/events',
            icon: CalendarDays,
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
        ...(canManageUsers
            ? [
                  {
                      title: t('dashboard.tabs.settings'),
                      href: '/dashboard/site-settings',
                      icon: Settings,
                  },
              ]
            : []),
        ...(canManageUsers
            ? [
                  {
                      title: t('dashboard.tabs.books'),
                      href: '/dashboard/books',
                      icon: Library,
                  },
                  {
                      title: t('dashboard.tabs.categories'),
                      href: '/dashboard/categories',
                      icon: Folder,
                  },
                  {
                      title: t('dashboard.tabs.orders'),
                      href: '/dashboard/orders',
                      icon: Coins,
                  },
                  {
                      title: t('dashboard.tabs.users'),
                      href: '/dashboard/users',
                      icon: Users,
                  },
              ]
            : []),
        ...(isAdmin
            ? [
                  {
                      title: t('dashboard.tabs.languages'),
                      href: '/dashboard/languages',
                      icon: Globe,
                  },
              ]
            : []),
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
