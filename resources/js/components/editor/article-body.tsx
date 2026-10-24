/**
 * Read-only renderer for article and post bodies.
 *
 * The HTML comes from the server already sanitized by HTMLPurifier; this
 * component only mounts the charts embedded as `<canvas data-chart>` blocks and
 * applies the body's own text direction, so a Pashto article reads correctly even
 * when the surrounding UI is English.
 */
import { mountCharts } from '@/lib/charts';
import { useEffect, useRef } from 'react';

interface ArticleBodyProps {
    /** Server-sanitized HTML produced by the Tiptap editor. */
    body: string;
    /**
     * Text direction for the article content. Driven by the article's own
     * language so it renders correctly regardless of the reader's UI language.
     * The rest of the page keeps its own direction.
     */
    dir?: 'rtl' | 'ltr';
    className?: string;
}

/**
 * Read-only renderer for an article body. The HTML is already sanitized on the
 * server, so it is safe to inject. Embedded chart blocks (`[data-chart-type]`)
 * are hydrated client-side with Chart.js after mount.
 */
export default function ArticleBody({ body, dir, className }: ArticleBodyProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cleanup = mountCharts(ref.current);
        return cleanup;
    }, [body]);

    return (
        <div
            ref={ref}
            dir={dir}
            className={`article-body ${className ?? ''}`.trim()}
            // Content is sanitized server-side by HTMLPurifier before storage.
            dangerouslySetInnerHTML={{ __html: body }}
        />
    );
}
