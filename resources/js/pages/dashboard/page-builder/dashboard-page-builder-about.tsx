/**
 * About page builder.
 *
 * The About page is authored by the same unified editor as the home page; the
 * controller supplies this page's draft feed, palette, save endpoint and
 * breadcrumbs. Keeping a thin page module preserves Inertia's page-based
 * component resolution (and keeps the two pages independently addressable).
 */
export { PageBuilderEditor as default } from './dashboard-page-builder-home';
