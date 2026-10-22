import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

interface HomeBlockFrameProps {
    label: string;
    /** When set, the block is editable and an Edit button opens its panel. */
    onEdit?: () => void;
    /** Short helper text for preview-only blocks (e.g. where to manage them). */
    note?: string;
    /** Localized label for the Edit button (defaults to "Edit"). */
    editLabel?: string;
    children: ReactNode;
}

/**
 * Admin-only wrapper around a built-in home block. Shows the same content the
 * visitor sees, with a small labelled toolbar. Editable blocks expose an Edit
 * button; automatic blocks (programs / jobs) show a note pointing to where they
 * are managed, since they render live records rather than home-page text.
 */
export default function HomeBlockFrame({
    label,
    onEdit,
    note,
    editLabel = 'Edit',
    children,
}: HomeBlockFrameProps) {
    return (
        <div className="rounded-xl outline-1 outline-transparent transition outline-dashed hover:outline-blue-300/70">
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50/60 px-3 py-1.5 text-xs dark:border-blue-800 dark:bg-blue-950/30">
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {label}
                </span>
                {note ? (
                    <span className="text-muted-foreground">{note}</span>
                ) : null}
                {onEdit ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="ms-auto h-7 px-2 text-xs"
                        onClick={onEdit}
                    >
                        ✎ {editLabel}
                    </Button>
                ) : null}
            </div>
            {children}
        </div>
    );
}
