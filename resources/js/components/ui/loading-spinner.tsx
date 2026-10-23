import { Spinner } from '@/components/ui/spinner';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

type LoadingSpinnerSize = 'sm' | 'md' | 'lg';

const glyphSize: Record<LoadingSpinnerSize, string> = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
};

interface LoadingSpinnerProps {
    /** Size of the rotating glyph; the label stays at a readable `text-sm`. */
    size?: LoadingSpinnerSize;
    /** Already-translated status text rendered next to the glyph. */
    label?: string;
    /** Take a full-width centered row instead of sitting inline with content. */
    block?: boolean;
    className?: string;
}

/**
 * Shared loading indicator built on the `Spinner` glyph.
 *
 * The wrapper is the single `role="status"` live region so the label is
 * announced once, and the glyph itself is hidden from assistive tech. Under
 * `prefers-reduced-motion` the rotation is dropped — the label keeps carrying
 * the state, in line with the repo's animation accessibility rule.
 */
export default function LoadingSpinner({
    size = 'md',
    label,
    block = false,
    className,
}: LoadingSpinnerProps) {
    const reducedMotion = useReducedMotion();

    return (
        <span
            role="status"
            className={cn(
                'inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400',
                block && 'w-full justify-center py-1',
                className,
            )}
        >
            <Spinner
                // Neutralize the glyph's own status semantics: this wrapper is
                // the live region and its label is the translated one.
                role="none"
                aria-hidden
                aria-label={undefined}
                className={cn(glyphSize[size], reducedMotion && 'animate-none')}
            />
            {label ? <span>{label}</span> : null}
        </span>
    );
}
