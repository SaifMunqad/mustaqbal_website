import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

/**
 * Renders the dashboard navigation as a set of labelled categories. Each group
 * becomes its own {@see SidebarGroup}; the label collapses away in icon mode so
 * only the (icon) links remain, keeping the sidebar readable at every width.
 */
export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const page = usePage();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';

    const visibleGroups = groups.filter((group) => group.items.length > 0);

    return (
        <>
            {visibleGroups.map((group) => (
                <SidebarGroup key={group.titleKey} className="px-2 py-0">
                    <SidebarGroupLabel>{t(group.titleKey)}</SidebarGroupLabel>
                    <SidebarMenu className={isRtl ? 'text-right' : 'text-left'}>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={page.url.startsWith(
                                        resolveUrl(item.href),
                                    )}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
