import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface SmartLinkProps {
    href: string;
    className?: string;
    children: ReactNode;
}

// Internal app routes use the client-side Inertia Link; anything else (absolute
// URLs, mailto:, tel:) falls back to a plain anchor so the browser handles it.
export function isExternalHref(href: string): boolean {
    return (
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
    );
}

/**
 * Renders an Inertia Link for internal navigation or an anchor for external,
 * mailto, and tel targets, so callers pass a single href without branching.
 */
export default function SmartLink({ href, className, children }: SmartLinkProps) {
    if (isExternalHref(href)) {
        return (
            <a href={href} className={className}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}
