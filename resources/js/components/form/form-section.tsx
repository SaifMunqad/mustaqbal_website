import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface FormSectionProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    /** Optional element rendered on the far side of the section header (e.g. a badge or action). */
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    /** Number of columns for the inner field grid. Defaults to a single column. */
    columns?: 1 | 2;
}

/**
 * A titled, described card that groups related fields together.
 *
 * Replaces the flat "wall of inputs" layout used across the dashboard create and
 * edit pages so editors read as clear, scannable sections.
 */
export default function FormSection({
    title,
    description,
    icon,
    action,
    children,
    className,
    columns = 1,
}: FormSectionProps) {
    return (
        <section
            className={cn(
                'space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {icon ? (
                            <span className="text-blue-600">{icon}</span>
                        ) : null}
                        <h2 className="text-base font-semibold text-foreground">
                            {title}
                        </h2>
                    </div>
                    {description ? (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>

            <div
                className={cn(
                    'grid gap-4',
                    columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1',
                )}
            >
                {children}
            </div>
        </section>
    );
}
