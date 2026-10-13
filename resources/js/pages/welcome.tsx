import ShowcaseSection, {
    ShowcaseGroup,
} from '@/components/general/showcase/showcase-section';
import CtaBand from '@/components/home/cta-band';
import FeatureGrid from '@/components/home/feature-grid';
import HomeHero from '@/components/home/home-hero';
import HomeSections, {
    type HomeSection,
} from '@/components/home/home-sections';
import LatestJobs from '@/components/home/latest-jobs';
import ProgramsHighlight from '@/components/home/programs-highlight';
import StatsBar from '@/components/home/stats-bar';
import type { Job } from '@/components/school/job-card';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import type { Program } from '@/pages/school/programs/program-card';
import type { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface WelcomeProps extends SharedData {
    showcase?: ShowcaseGroup[];
    sections?: HomeSection[];
    programs?: Program[];
    jobs?: Job[];
}

function Welcome() {
    const { t } = useTranslation();
    const { showcase, sections, programs, jobs, site } =
        usePage<WelcomeProps>().props;

    const home = site?.home ?? {};
    const tagline = site?.tagline;

    // Curated sections are admin-managed content; the template gives them fixed
    // slots: banner blocks sit between Jobs and "Why families choose", and every
    // other curated block (articles, events, recognition, announcements) lands
    // after "Why families choose". Relative order within each slot still follows
    // the admin's sort_order.
    const curated = sections ?? [];
    const bannerSections = curated.filter(
        (section) => section.variant === 'banner',
    );
    const otherSections = curated.filter(
        (section) => section.variant !== 'banner',
    );
    const legacyShowcase = showcase ?? [];
    const hasCurated = curated.length > 0;

    return (
        <div className="space-y-8">
            <Head title={t('navigation.home')} />

            <Reveal direction="fade" defaultInView>
                <HomeHero home={home} tagline={tagline} />
            </Reveal>

            <Reveal>
                <ProgramsHighlight programs={programs ?? []} />
            </Reveal>

            <Reveal>
                <FeatureGrid features={site?.features ?? []} />
            </Reveal>
            <Reveal>
                <StatsBar stats={site?.stats ?? []} />
            </Reveal>

            <Reveal>
                <LatestJobs jobs={jobs ?? []} />
            </Reveal>

            {bannerSections.length > 0 ? (
                <Reveal>
                    <HomeSections sections={bannerSections} />
                </Reveal>
            ) : null}

            {hasCurated ? (
                otherSections.length > 0 ? (
                    <Reveal>
                        <HomeSections sections={otherSections} />
                    </Reveal>
                ) : null
            ) : legacyShowcase.length > 0 ? (
                <Reveal>
                    <ShowcaseSection groups={legacyShowcase} />
                </Reveal>
            ) : null}

            <Reveal>
                <CtaBand />
            </Reveal>
        </div>
    );
}

// Use the layout
Welcome.layout = (page: ReactNode) => <MainLayout children={page} />;

export default Welcome;
