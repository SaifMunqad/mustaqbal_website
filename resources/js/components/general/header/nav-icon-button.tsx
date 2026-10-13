import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { navIconButtonClass } from '@/components/general/header/navbar-styles';

interface NavIconButtonProps {
    // Accessible name, applied to both aria-label and title.
    label: string;
    // When provided the control renders an Inertia Link; otherwise a button.
    href?: string;
    onClick?: () => void;
    children: ReactNode;
}

/**
 * Square icon-only control shared by the navbar (search, mobile menu). Renders a
 * client-side route Link for internal navigation or a plain button for actions,
 * so both variants keep identical chrome styling.
 */
export default function NavIconButton({
    label,
    href,
    onClick,
    children,
}: NavIconButtonProps) {
    if (href) {
        return (
            <Link href={href} aria-label={label} title={label} className={navIconButtonClass}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={navIconButtonClass}
        >
            {children}
        </button>
    );
}
