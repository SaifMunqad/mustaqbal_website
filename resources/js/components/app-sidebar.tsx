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
    Briefcase,
    CalendarDays,
    FileText,
    Folder,
    Globe,
    Home,
    LayoutGrid,
    Library,
    Mail,
    MessageSquare,
    Newspaper,
    School,
    Send,
    Settings,
    Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t, i18n } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const canManageUsers = ['admin', 'management'].includes(auth.user?.role ?? '');
    const isAdmin = auth.user?.role === 'admin';

    const mainNavItems: NavItem[] = [
        {
            title: t('dashboard.tabs.overview'),
            href: '/dashboard',
            icon: LayoutGrid,
        },
        ...(canManageUsers
            ? [
                  {
                      title: t('dashboard.tabs.homePage'),
                      href: '/dashboard/home-sections',
                      icon: Home,
                  },
              ]
            : []),
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
        ...(isAdmin
            ? [
                  {
                      title: t('dashboard.tabs.emailCampaigns'),
                      href: '/dashboard/email-campaigns',
                      icon: Send,
                  },
              ]
            : []),
        {
            title: t('dashboard.tabs.programs'),
            href: '/dashboard/programs',
            icon: School,
        },
        ...(canManageUsers
            ? [
                  {
                      title: t('dashboard.tabs.jobs'),
                      href: '/dashboard/jobs',
                      icon: Briefcase,
                  },
              ]
            : []),
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
        <Sidebar
            collapsible="icon"
            variant="inset"
            side={i18n.dir() === 'rtl' ? 'right' : 'left'}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
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
