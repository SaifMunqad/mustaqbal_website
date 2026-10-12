import Chart from 'chart.js/auto';
import type { ChartType } from 'chart.js';

/**
 * Shared helpers for rendering the embedded "chart" blocks that the Tiptap
 * article editor stores as `<div data-chart-*>` elements.
 *
 * The same logic is used in two places:
 *   - the editor node view (live preview while writing), and
 *   - the read-only article renderer on the public site.
 *
 * Chart data is intentionally kept as simple, comma-separated strings in
 * data attributes so it survives HTMLPurifier sanitization on the server.
 */

export interface ChartAttrs {
    type: string;
    title: string;
    labels: string;
    values: string;
}

const splitList = (value: string): string[] =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const parseValues = (value: string): number[] =>
    value
        .split(',')
        .map((item) => Number.parseFloat(item.trim()))
        .filter((num) => !Number.isNaN(num));

const PALETTE = [
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#dc2626',
    '#7c3aed',
    '#0891b2',
    '#db2777',
    '#65a30d',
];

const isPieLike = (type: string) => type === 'pie' || type === 'doughnut';

/**
 * Build a Chart.js configuration object from a chart block's attributes.
 */
export function buildChartConfig(attrs: ChartAttrs): {
    type: ChartType;
    data: unknown;
    options: unknown;
} {
    const labels = splitList(attrs.labels);
    const values = parseValues(attrs.values);
    const pie = isPieLike(attrs.type);

    return {
        // Chart.js accepts the string type; cast for the generic constructor.
        type: (attrs.type || 'bar') as ChartType,
        data: {
            labels,
            datasets: [
                {
                    label: attrs.title || 'Data',
                    data: values,
                    backgroundColor: pie
                        ? labels.map((_, i) => PALETTE[i % PALETTE.length])
                        : (PALETTE[0] + 'cc'),
                    borderColor: PALETTE[0],
                    borderWidth: pie ? 1 : 2,
                    tension: 0.3,
                    fill: attrs.type === 'line',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: pie },
                title: {
                    display: Boolean(attrs.title),
                    text: attrs.title,
                },
            },
            scales: pie
                ? {}
                : {
                      y: { beginAtZero: true },
                  },
        },
    };
}

/**
 * Mount Chart.js canvases onto every `[data-chart-type]` element inside the
 * given root. Returns a cleanup function that destroys the created charts.
 *
 * Static HTML is rendered by the server; charts hydrate client-side, so this
 * is safe to call from a React effect.
 */
export function mountCharts(root: HTMLElement | null): () => void {
    if (!root) {
        return () => {};
    }

    const containers = Array.from(
        root.querySelectorAll<HTMLElement>('[data-chart-type]'),
    );
    const charts: Chart[] = [];

    for (const container of containers) {
        // Skip containers that already have a canvas (idempotent re-mounts).
        if (container.querySelector('canvas')) {
            continue;
        }

        const attrs: ChartAttrs = {
            type: container.dataset.chartType ?? 'bar',
            title: container.dataset.chartTitle ?? '',
            labels: container.dataset.chartLabels ?? '',
            values: container.dataset.chartValues ?? '',
        };

        const canvas = document.createElement('canvas');
        canvas.className = 'article-chart-canvas';
        container.appendChild(canvas);

        try {
            charts.push(
                new Chart(canvas, buildChartConfig(attrs) as never),
            );
        } catch {
            // Ignore malformed chart data rather than breaking the page.
        }
    }

    return () => {
        for (const chart of charts) {
            chart.destroy();
        }
    };
}
