import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';

interface StickyFormFooterProps {
    submitLabel: string;
    processing?: boolean;
    disabled?: boolean;
    /** Href for the cancel/back link. */
    cancelHref?: string;
    cancelLabel?: string;
    /** Extra actions rendered next to the submit button (e.g. Delete). */
    children?: ReactNode;
    className?: string;
}

/**
 * Persistent action bar for the bottom of long create/edit forms so the primary
 * action is always reachable without scrolling back up. Rendered inside an
 * Inertia `<Form>` so the submit button picks up the form automatically.
 */
export default function StickyFormFooter({
    submitLabel,
    processing = false,
    disabled = false,
    cancelHref,
    cancelLabel = 'Cancel',
    children,
    className,
}: StickyFormFooterProps) {
    return (
        <div
            className={cn(
                'sticky bottom-0 z-10 -mx-2 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background/90 px-2 py-3 backdrop-blur',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-3">{children}</div>
            <div className="ms-auto flex flex-wrap items-center gap-3">
                {cancelHref ? (
                    <Button type="button" variant="ghost" asChild>
                        <Link href={cancelHref}>{cancelLabel}</Link>
                    </Button>
                ) : null}
                <Button type="submit" disabled={processing || disabled}>
                    {processing ? 'Saving…' : submitLabel}
                </Button>
            </div>
        </div>
    );
}
