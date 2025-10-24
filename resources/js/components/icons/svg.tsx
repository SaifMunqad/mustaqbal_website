import { ReactNode } from 'react';

interface SvgComponentsProps {
    children: ReactNode;
    className?: string;
    viewBox?: string;
}

export default function SvgComponents({
    children,
    className = ' size-5 text-gray-800 dark:text-white',
    viewBox = '0 0 24 24',
}: SvgComponentsProps) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBox}
        >
            {children}
        </svg>
    );
}
