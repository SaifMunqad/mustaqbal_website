/**
 * Persistent dashboard navigation rail.
 *
 * Builds the menu from role-aware groups (overview / content / community /
 * communications / system). Items the current user may not access are filtered
 * out before rendering; `NavMain` drops any group that ends up empty, so no
 * labels appear without children. Labels are translation keys resolved here via
 * `react-i18next`.
 */
import { NavMain } from '@/components/layout/nav-main';
import { NavUser } from '@/components/layout/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavGroup, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    CalendarDays,
    FileText,
    Globe,
    GraduationCap,
    Home,
    Info,
    LayoutGrid,
    Library,
    MessageSquare,
    Newspaper,
    Phone,
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

    // Navigation is grouped into labelled categories. Role-restricted items are
    // only added to their group when the current user qualifies; empty groups are
    // dropped by NavMain. The WhatsApp API settings screen is intentionally not a
    // top-level item — it lives inside the "Bulk WhatsApp" area.
    const groups: NavGroup[] = [
        {
            titleKey: 'dashboard.sidebar.overview',
            items: [
                {
                    title: t('dashboard.tabs.overview'),
                    href: '/dashboard',
                    icon: LayoutGrid,
                },
            ],
        },
        {
            titleKey: 'dashboard.sidebar.content',
            items: [
                ...(canManageUsers
                    ? [
                          {
                              title: t('dashboard.tabs.homePage'),
                              href: '/dashboard/pages/home',
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
                    title: t('dashboard.tabs.programs'),
                    href: '/dashboard/programs',
                    icon: School,
                },
                ...(canManageUsers
                    ? [
                          {
                              title: t('dashboard.tabs.about'),
                              href: '/dashboard/about',
                              icon: Info,
                          },
                          {
                              title: t('dashboard.tabs.contactPage'),
                              href: '/dashboard/pages/contact',
                              icon: Phone,
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
                              title: t('dashboard.tabs.jobs'),
                              href: '/dashboard/jobs',
                              icon: Briefcase,
                          },
                          {
                              title: t('dashboard.tabs.awards'),
                              href: '/dashboard/awards',
                              icon: Award,
                          },
                      ]
                    : []),
            ],
        },
        {
            titleKey: 'dashboard.sidebar.community',
            items: [
                {
                    title: t('dashboard.tabs.messages'),
                    href: '/dashboard/messages',
                    icon: MessageSquare,
                },
                ...(canManageUsers
                    ? [
                          {
                              title: t('dashboard.tabs.enrollments'),
                              href: '/dashboard/enrollments',
                              icon: GraduationCap,
                          },
                      ]
                    : []),
            ],
        },
        {
            titleKey: 'dashboard.sidebar.bulkMessages',
            items: isAdmin
                ? [
                      {
                          title: t('dashboard.tabs.emailCampaigns'),
                          href: '/dashboard/email-campaigns',
                          icon: Send,
                      },
                      {
                          title: t('dashboard.tabs.whatsappCampaigns'),
                          href: '/dashboard/whatsapp-campaigns',
                          icon: Phone,
                      },
                  ]
                : [],
        },
        {
            titleKey: 'dashboard.sidebar.administration',
            items: [
                ...(canManageUsers
                    ? [
                          {
                              title: t('dashboard.tabs.settings'),
                              href: '/dashboard/site-settings',
                              icon: Settings,
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
            ],
        },
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
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
