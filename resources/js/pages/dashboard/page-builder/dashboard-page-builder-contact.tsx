/**
 * Contact page builder.
 *
 * The Contact page is authored by the same unified editor as Home and About;
 * the controller supplies this page's draft feed, palette, save endpoint and
 * breadcrumbs. Every builder page offers the identical block catalog, so the
 * only difference between the three is the page key they are saved under.
 *
 * The wrapper must be a real module with its own default export: a bare
 * `export { X as default } from` re-export is treated by Rollup as a facade of
 * the source module, so Vite emits no manifest entry for this path and Laravel
 * throws "Unable to locate file in Vite manifest" when the page renders.
 */
import { PageBuilderEditor } from './dashboard-page-builder-home';

export default function DashboardPageBuilderContact() {
    return <PageBuilderEditor />;
}
