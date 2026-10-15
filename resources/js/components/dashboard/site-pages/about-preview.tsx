import AboutCtaBand from '@/components/school/about/about-cta-band';
import AboutFaqSection from '@/components/school/about/about-faq-section';
import AboutGoalsPointsSection from '@/components/school/about/about-goals-points-section';
import AboutHero from '@/components/school/about/about-hero';
import AboutHighlightsSection from '@/components/school/about/about-highlights-section';
import AboutLeadershipMessage from '@/components/school/about/about-leadership-message';
import AboutMissionVision from '@/components/school/about/about-mission-vision';
import AboutStatsBand from '@/components/school/about/about-stats-band';
import AboutStorySection from '@/components/school/about/about-story-section';
import AboutValuesSection from '@/components/school/about/about-values-section';
import AboutVideoSection from '@/components/school/about/about-video-section';
import type { AboutContent } from '@/components/school/about/about-types';
import { useTranslation } from 'react-i18next';

interface AboutPreviewProps {
    title: string;
    content: AboutContent;
    heroImage?: string | null;
}

/**
 * Read-only live preview of the About page for the currently editing language.
 * Reuses the exact public section components so what the editor shows matches
 * what visitors get; empty sections render nothing (mirroring the public view).
 */
export default function AboutPreview({ title, content, heroImage }: AboutPreviewProps) {
    const { t } = useTranslation();

    const body = content.body?.trim();
    const stats = (content.stats ?? []).filter((s) => s.value || s.label);
    const values = (content.values ?? []).filter((v) => v.title);
    const highlights = (content.highlights ?? []).filter((h) => h.title);
    const faq = (content.faq ?? []).filter((f) => f.question);
    const goals = content.goals ?? [];
    const mainPoints = content.main_points ?? [];
    const videoEmbed = content.video_embed?.trim();

    const message =
        content.message?.text || content.manager_message
            ? {
                  text: content.message?.text ?? content.manager_message,
                  author_name: content.message?.author_name,
                  author_role: content.message?.author_role ?? t('about.managerMessage'),
                  author_image: content.message?.author_image,
              }
            : null;

    return (
        <div className="space-y-6">
            <AboutHero
                title={title || t('about.title')}
                intro={content.intro ?? (body ? undefined : t('about.paragraph'))}
                image={heroImage ?? null}
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
