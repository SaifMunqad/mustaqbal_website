import { Button } from '@/components/ui/button';
import { type ReactNode } from 'react';

// Shared styling for the dashboard listing filter bars.
export const filterBarClass =
    'flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3';
export const filterInputClass =
    'rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
export const filterSelectClass =
    'rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none';

interface ResourceFilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    onApply: () => void;
    placeholder: string;
    // Optional extra controls (e.g. role/status selects) rendered before the
    // Filter button.
    children?: ReactNode;
}

/**
 * Consistent filter toolbar for resource listing pages: a search box (Enter
 * applies), any extra controls, and an apply button.
 */
export default function ResourceFilterBar({
    search,
    onSearchChange,
    onApply,
    placeholder,
    children,
}: ResourceFilterBarProps) {
    return (
        <div className={filterBarClass}>
            <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && onApply()}
                placeholder={placeholder}
                className={filterInputClass}
            />
            {children}
            <Button type="button" onClick={onApply}>
                Filter
            </Button>
        </div>
    );
}
