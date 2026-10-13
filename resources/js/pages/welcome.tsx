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

    const curated = sections ?? [];
    const legacyShowcase = showcase ?? [];

    return (
        <div className="space-y-8">
            <Head title={t('navigation.home')} />

            <HomeHero home={home} tagline={tagline} />

            <StatsBar stats={site?.stats ?? []} />

            <FeatureGrid features={site?.features ?? []} />

            <ProgramsHighlight programs={programs ?? []} />

            <LatestJobs jobs={jobs ?? []} />

            {curated.length > 0 ? (
                <HomeSections sections={curated} />
            ) : legacyShowcase.length > 0 ? (
                <ShowcaseSection groups={legacyShowcase} />
            ) : null}

            <CtaBand />
        </div>
    );
}

// Use the layout
Welcome.layout = (page: ReactNode) => <MainLayout children={page} />;

export default Welcome;
