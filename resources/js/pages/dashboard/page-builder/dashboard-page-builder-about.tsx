/**
 * About page builder.
 *
 * The About page is authored by the same unified editor as the home page; the
 * controller supplies this page's draft feed, palette, save endpoint and
 * breadcrumbs. Keeping a thin page module preserves Inertia's page-based
 * component resolution (and keeps the two pages independently addressable).
 *
 * The wrapper must be a real module with its own default export: a bare
 * `export { X as default } from` re-export is treated by Rollup as a facade of
 * the source module, so Vite emits no manifest entry for this path and Laravel
 * throws "Unable to locate file in Vite manifest" when the page renders.
 */
import { PageBuilderEditor } from './dashboard-page-builder-home';

export default function DashboardPageBuilderAbout() {
    return <PageBuilderEditor />;
}
