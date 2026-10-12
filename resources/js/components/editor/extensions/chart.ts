import { Node, mergeAttributes } from '@tiptap/core';
import Chart from 'chart.js/auto';
import { buildChartConfig, type ChartAttrs } from '@/lib/charts';

export interface ChartOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        chart: {
            /** Insert an embedded chart block. */
            insertChart: (attrs: ChartAttrs) => ReturnType;
        };
    }
}

/**
 * A block-level atom node representing an embedded Chart.js graph.
 *
 * It serializes to a plain `<div data-chart-*>` element (kept clean by the
 * server-side HTMLPurifier config) and renders a live chart preview inside the
 * editor through a vanilla ProseMirror node view. The exact same data shape is
 * re-hydrated on the public article page by `mountCharts()`.
 */
export const ChartNode = Node.create<ChartOptions>({
    name: 'chart',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            chartType: {
                default: 'bar',
                parseHTML: (element) => element.getAttribute('data-chart-type'),
                renderHTML: (attributes) => ({
                    'data-chart-type': attributes.chartType,
                }),
            },
            chartTitle: {
                default: '',
                parseHTML: (element) =>
                    element.getAttribute('data-chart-title'),
                renderHTML: (attributes) => ({
                    'data-chart-title': attributes.chartTitle,
                }),
            },
            chartLabels: {
                default: '',
                parseHTML: (element) =>
                    element.getAttribute('data-chart-labels'),
                renderHTML: (attributes) => ({
                    'data-chart-labels': attributes.chartLabels,
                }),
            },
            chartValues: {
                default: '',
                parseHTML: (element) =>
                    element.getAttribute('data-chart-values'),
                renderHTML: (attributes) => ({
                    'data-chart-values': attributes.chartValues,
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-chart-type]' }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: 'article-chart',
                'data-chart-type': node.attrs.chartType,
            }),
        ];
    },

    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement('div');
            dom.className = 'article-chart article-chart--view';

            const canvas = document.createElement('canvas');
            canvas.className = 'article-chart-canvas';
            dom.appendChild(canvas);

            let chart: Chart | null = null;

            const attrsOf = (target: typeof node): ChartAttrs => ({
                type: target.attrs.chartType ?? 'bar',
                title: target.attrs.chartTitle ?? '',
                labels: target.attrs.chartLabels ?? '',
                values: target.attrs.chartValues ?? '',
            });

            const render = (target: typeof node) => {
                if (chart) {
                    chart.destroy();
                }
                try {
                    chart = new Chart(canvas, buildChartConfig(attrsOf(target)) as never);
                } catch {
                    chart = null;
                }
            };

            render(node);

            return {
                dom,
                ignoreSelection: true,
                selectNode() {
                    dom.classList.add('ProseMirror-selectednode');
                },
                deselectNode() {
                    dom.classList.remove('ProseMirror-selectednode');
                },
                update(updatedNode) {
                    if (updatedNode.type.name !== 'chart') {
                        return false;
                    }
                    render(updatedNode);
                    return true;
                },
                destroy() {
                    if (chart) {
                        chart.destroy();
                        chart = null;
                    }
                },
            };
        };
    },

    addCommands() {
        return {
            insertChart:
                (attrs: ChartAttrs) =>
                ({ commands }) =>
                    commands.insertContent({
                        type: 'chart',
                        attrs: {
                            chartType: attrs.type || 'bar',
                            chartTitle: attrs.title || '',
                            chartLabels: attrs.labels || '',
                            chartValues: attrs.values || '',
                        },
                    }),
        };
    },
});

export default ChartNode;
