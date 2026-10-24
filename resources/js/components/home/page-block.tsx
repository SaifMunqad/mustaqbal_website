import FeatureGrid from '@/components/home/feature-grid';
import HomeHero from '@/components/home/home-hero';
import HomeSections, {
    type HomeSection,
    type HomeSectionConfig,
} from '@/components/home/home-sections';
import LatestJobs from '@/components/home/latest-jobs';
import ProgramsHighlight from '@/components/home/programs-highlight';
import StatsBar from '@/components/home/stats-bar';
import {
    Cta,
    Contact,
    ContactDetails,
    ContactForm,
    CountdownBlock,
    Faq,
    Gallery,
    IconCards,
    ListGrid,
    Logos,
    MapBlock,
    MediaText,
    Newsletter,
    Quote,
    RichTextBlock,
    SocialLinks,
    StatsCards,
    VideoEmbed,
} from '@/components/home/blocks';
import type { HomeCard } from '@/components/home/home-card-item';
import type { HomeFeature, HomeStat } from '@/types';
import Reveal from '@/components/ui/reveal';

/** One row of a block's ordered, localized list (section_list_items). */
export interface BlockListRow {
    value: string;
    title: string;
    description: string;
    icon: string;
    image: string;
    url: string;
}

/**
 * A render-ready block produced by `App\Support\Home\PageSections::render()`.
 *
 * The `component` key (from `SectionType::component()`) selects the view; the
 * matching data slice (`items` / `config` / `features` / `stats` / `hero` /
 * `programs` / `jobs`) carries its content, and `spans` drives responsive
 * placement. The SAME component map renders both the public page and the editor
 * canvas, so the preview is byte-for-byte the visitor experience.
 */
export interface RenderBlock {
    id: number;
    type: string;
    component: string;
    variant: 'cards' | 'banner' | 'announcement';
    kind: 'curated' | 'authored';
    zone: string;
    sort_order: number;
    is_active: boolean;
    type_label: string;
    title: string;
    spans: { lg: number; md: number; sm: number };
    /** Admin-chosen track count for grid/list blocks; null keeps the default. */
    columns?: number | null;
    items?: HomeCard[];
    config?: HomeSectionConfig;
    features?: HomeFeature[];
    stats?: HomeStat[];
    // Generic fields shared by the newer content-rail / conversion / layout
    // blocks (see PageSections::genericPayload).
    text?: { heading?: string; body?: string; cta_label?: string };
    cta_url?: string | null;
    image_path?: string | null;
    tone?: string;
    list?: BlockListRow[];
    hero?: {
        title?: string;
        subtitle?: string;
        cta_primary?: string;
        cta_secondary?: string;
        cta_primary_url?: string;
        cta_secondary_url?: string;
        tagline?: string;
        hero_image?: string;
    };
    programs?: unknown[];
    jobs?: unknown[];
}

/** Render one normalized block by delegating to its registered component. */
export function HomeBlock({
    block,
    rtl = false,
}: {
    block: RenderBlock;
    rtl?: boolean;
}) {
    switch (block.component) {
        case 'hero':
            return (
                <HomeHero
                    home={{
                        title: block.hero?.title,
                        subtitle: block.hero?.subtitle,
                        cta_primary: block.hero?.cta_primary,
                        cta_secondary: block.hero?.cta_secondary,
                        cta_primary_url: block.hero?.cta_primary_url,
                        cta_secondary_url: block.hero?.cta_secondary_url,
                        hero_image: block.hero?.hero_image,
                    }}
                    tagline={block.hero?.tagline}
                    rtl={rtl}
                />
            );

        case 'features':
            return (
                <FeatureGrid
                    features={block.features ?? []}
                    heading={block.text?.heading}
                    body={block.text?.body}
                    columns={block.columns}
                />
            );

        case 'icon_cards':
            return <IconCards block={block} />;

        case 'stats':
            return (
                <StatsBar
                    stats={block.stats ?? []}
                    heading={block.text?.heading}
                    body={block.text?.body}
                    columns={block.columns}
                />
            );

        case 'programs':
            return (
                <ProgramsHighlight
                    programs={(block.programs ?? []) as never}
                />
            );

        case 'jobs':
            return <LatestJobs jobs={(block.jobs ?? []) as never} />;

        // Newer blocks render from the shared generic fields (text / list / config).
        case 'list':
            return <ListGrid block={block} />;
        case 'logos':
            return <Logos block={block} />;
        case 'gallery':
            return <Gallery block={block} />;
        case 'faq':
            return <Faq block={block} />;
        case 'social':
            return <SocialLinks block={block} />;
        case 'contact':
            return <Contact block={block} />;
        case 'contact_form':
            return <ContactForm block={block} />;
        case 'contact_details':
            return <ContactDetails block={block} />;
        case 'cta':
            return <Cta block={block} />;
        case 'quote':
            return <Quote block={block} />;
        case 'media_text':
            return <MediaText block={block} />;
        case 'video':
            return <VideoEmbed block={block} />;
        case 'rich_text':
            return <RichTextBlock block={block} />;
        case 'map':
            return <MapBlock block={block} />;
        case 'newsletter':
            return <Newsletter block={block} />;
        case 'countdown':
            return <CountdownBlock block={block} />;
        case 'stats_cards':
            return <StatsCards block={block} />;

        // banner / announcement / cards all flow through the section renderer.
        default: {
            const section: HomeSection = {
                id: block.id,
                type: block.type,
                variant: block.variant,
                title: block.title,
                items: block.items,
                config: block.config,
            };

            return <HomeSections sections={[section]} />;
        }
    }
}

/**
 * The responsive, overlap-safe layout. Each block becomes a grid item whose
 * column span comes from `spans` (via CSS custom properties); the browser flows
 * them into successive free cells so nothing ever overlaps or interleaves.
 */
export default function PageGrid({
    blocks,
    rtl = false,
    reveal = true,
}: {
    blocks: RenderBlock[];
    rtl?: boolean;
    reveal?: boolean;
}) {
    return (
        <div className="page-grid">
            {blocks.map((block) => (
                <div
                    key={block.id}
                    className="page-grid-item"
                    style={
                        {
                            '--lg': block.spans.lg,
                            '--md': block.spans.md,
                            '--sm': block.spans.sm,
                        } as React.CSSProperties
                    }
                >
                    {reveal ? (
                        <Reveal direction="fade">
                            <HomeBlock block={block} rtl={rtl} />
                        </Reveal>
                    ) : (
                        <HomeBlock block={block} rtl={rtl} />
                    )}
                </div>
            ))}
        </div>
    );
}
