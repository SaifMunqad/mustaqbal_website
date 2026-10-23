import { useInView } from '@/hooks/use-in-view';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { createElement } from 'react';

export type RevealDirection = 'up' | 'down' | 'fade' | 'zoom';

interface RevealProps {
    /** Element/tag to render as. Defaults to a div. */
    as?: ElementType;
    /** Entrance direction. Vertical + zoom only, so RTL never flips it. */
    direction?: RevealDirection;
    /** Transition delay in ms (use for grid staggering: index * step). */
    delay?: number;
    /** Transition duration in ms. */
    duration?: number;
    /** Unobserve after the first reveal. */
    once?: boolean;
    /**
     * Start already-visible. Use for above-the-fold/hero content so SSR
     * markup never paints a blank block before hydration.
     */
    defaultInView?: boolean;
    /** Distance in px the element travels for up/down directions. */
    distance?: number;
    /**
     * Fraction of the element visible before it reveals (0–1). Defaults to 0
     * so timing is set by `rootMargin` and stays consistent for both small
     * cards and tall sections.
     */
    threshold?: number;
    /**
     * IntersectionObserver root margin. The positive bottom value extends the
     * root below the viewport so an element reveals just *before* it scrolls
     * into view, e.g. '0px 0px 10% 0px' starts the animation while the element
     * is still ~10% below the bottom edge. A negative bottom would make the
     * reveal chase the scroll (element must rise into the viewport first),
     * which reads as a slow, laggy start.
     */
    rootMargin?: string;
    className?: string;
    children?: ReactNode;
}

/** Hidden state transform per direction (GPU-only: translate3d/scale). */
function hiddenTransform(direction: RevealDirection, distance: number): string {
    switch (direction) {
        case 'up':
            return `translate3d(0, ${distance}px, 0)`;
        case 'down':
            return `translate3d(0, -${distance}px, 0)`;
        case 'zoom':
            return 'scale(0.95)';
        default:
            return 'none';
    }
}

/**
 * Reveal-on-scroll wrapper: starts at opacity 0 and fades/rises into view
 * when it enters the viewport. Fully inline-style driven so it never depends
 * on a Tailwind utility being scanned/generated at build time.
 */
export function Reveal({
    as: Tag = 'div',
    direction = 'up',
    delay = 0,
    duration = 400,
    once = true,
    defaultInView = false,
    distance = 12,
    threshold = 0,
    rootMargin = '0px 0px 10% 0px',
    className,
    children,
}: RevealProps) {
    const { ref, inView } = useInView<HTMLElement>({
        once,
        initial: defaultInView,
        threshold,
        rootMargin,
    });


    const visible = defaultInView || inView;

    const style: CSSProperties = {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0, 0, 0) scale(1)' : hiddenTransform(direction, distance),
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: visible ? 'auto' : 'opacity, transform',
    };

    return createElement(Tag, { ref, className, style }, children);
}

export default Reveal;
