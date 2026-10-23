import FeatureGrid from '@/components/home/feature-grid';
import HomeHero from '@/components/home/home-hero';
import HomeSections, {
    type HomeSection,
    type HomeSectionConfig,
} from '@/components/home/home-sections';
import LatestJobs from '@/components/home/latest-jobs';
import ProgramsHighlight from '@/components/home/programs-highlight';
import StatsBar from '@/components/home/stats-bar';
import type { HomeCard } from '@/components/home/home-card-item';
import type { HomeFeature, HomeStat } from '@/types';
import Reveal from '@/components/ui/reveal';

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
    title_key: string;
    spans: { lg: number; md: number; sm: number };
    items?: HomeCard[];
    config?: HomeSectionConfig;
    features?: HomeFeature[];
    stats?: HomeStat[];
    hero?: {
        title?: string;
        subtitle?: string;
        cta_primary?: string;
        cta_secondary?: string;
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
                        hero_image: block.hero?.hero_image,
                    }}
                    tagline={block.hero?.tagline}
                    rtl={rtl}
                />
            );

        case 'features':
            return <FeatureGrid features={block.features ?? []} />;

        case 'stats':
            return <StatsBar stats={block.stats ?? []} />;

        case 'programs':
            return (
                <ProgramsHighlight
                    programs={(block.programs ?? []) as never}
                />
            );

        case 'jobs':
            return <LatestJobs jobs={(block.jobs ?? []) as never} />;

        // banner / announcement / cards all flow through the section renderer.
        default: {
            const section: HomeSection = {
                id: block.id,
                type: block.type,
                variant: block.variant,
                title: block.title,
                titleKey: block.title_key,
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
