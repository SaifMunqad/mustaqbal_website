import { Head, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '@/layouts/app/main-layout';
import AboutHero from '@/components/school/about/about-hero';
import AboutStatsBand from '@/components/school/about/about-stats-band';
import AboutStorySection from '@/components/school/about/about-story-section';
import AboutVideoSection from '@/components/school/about/about-video-section';
import AboutMissionVision from '@/components/school/about/about-mission-vision';
import AboutValuesSection from '@/components/school/about/about-values-section';
import AboutHighlightsSection from '@/components/school/about/about-highlights-section';
import AboutLeadershipMessage from '@/components/school/about/about-leadership-message';
import AboutGoalsPointsSection from '@/components/school/about/about-goals-points-section';
import AboutFaqSection from '@/components/school/about/about-faq-section';
import AboutCtaBand from '@/components/school/about/about-cta-band';
import type { AboutPageData } from '@/components/school/about/about-types';
import type { SiteSettings } from '@/types';

function SchoolAbout() {
    const { t } = useTranslation();
    const { page, site } = usePage<{ page: AboutPageData | null; site: SiteSettings }>().props;
    const content = page?.content ?? {};
    const title = page?.title ?? site?.brand_name ?? t('about.title');

    // Rich-text body authored from the dashboard is the main narrative.
    const body = content.body?.trim();

    // Fall back to the legacy `manager_message` field if no structured
    // leadership message has been seeded yet.
    const message =
        content.message?.text || content.manager_message
            ? {
                  text: content.message?.text ?? content.manager_message,
                  author_name: content.message?.author_name,
                  author_role: content.message?.author_role ?? t('about.managerMessage'),
                  author_image: content.message?.author_image,
              }
            : null;

    const stats = (content.stats ?? []).filter((stat) => stat.value || stat.label);
    const values = (content.values ?? []).filter((value) => value.title);
    const highlights = (content.highlights ?? []).filter((item) => item.title);
    const faq = (content.faq ?? []).filter((item) => item.question);
    const goals = content.goals ?? [];
    const mainPoints = content.main_points ?? [];
    const videoEmbed = content.video_embed?.trim();

    return (
        <div className="space-y-6 md:space-y-8">
            <Head title={title} />

            <AboutHero
                title={title}
                intro={content.intro ?? (body ? undefined : t('about.paragraph'))}
                image={page?.hero_image ?? site?.home?.hero_image ?? null}
                tagline={t('about.badge')}
                enrollLabel={t('about.heroEnroll')}
                contactLabel={t('about.heroContact')}
            />

            {stats.length ? <AboutStatsBand stats={stats} /> : null}

            {body ? <AboutStorySection body={body} /> : null}

            {videoEmbed ? <AboutVideoSection embed={videoEmbed} title={title} /> : null}

            <AboutMissionVision mission={content.mission} vision={content.vision} />

            {values.length ? <AboutValuesSection values={values} /> : null}

            {highlights.length ? <AboutHighlightsSection highlights={highlights} /> : null}

            {message?.text ? <AboutLeadershipMessage message={message} /> : null}

            {goals.length || mainPoints.length ? (
                <AboutGoalsPointsSection goals={goals} mainPoints={mainPoints} />
            ) : null}

            {faq.length ? <AboutFaqSection faqs={faq} /> : null}

            <AboutCtaBand />
        </div>
    );
}

SchoolAbout.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolAbout;
