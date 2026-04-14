import type { NavigationItem } from '@/lib/navigation';

const normalizePath = (value?: string | null): string => value ?? '';

export const isPathActive = (
    itemPath?: string | null,
    currentPath?: string | null,
): boolean => {
    const normalizedItemPath = normalizePath(itemPath);
    const normalizedCurrentPath = normalizePath(currentPath);

    if (!normalizedItemPath || !normalizedCurrentPath) {
        return false;
    }

    if (normalizedItemPath === '/') {
        return normalizedCurrentPath === '/';
    }

    return (
        normalizedCurrentPath === normalizedItemPath ||
        normalizedCurrentPath.startsWith(`${normalizedItemPath}/`)
    );
};

export const isNavigationItemActive = (
    item: NavigationItem,
    currentPath?: string | null,
): boolean => {
    if (isPathActive(item.href, currentPath)) {
        return true;
    }

    return (
        item.dropdown?.some((dropdownItem) =>
            isPathActive(dropdownItem.href, currentPath),
        ) ?? false
    );
};

