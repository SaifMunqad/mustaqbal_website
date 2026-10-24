import AboutSectionHeading from '@/components/school/about/about-section-heading';
import { useTranslation } from 'react-i18next';

/**
 * Turn an admin-pasted value into a safe iframe `src`. Accepts either a full
 * `<iframe>` embed code (we lift out its `src`) or a bare share URL, normalised
 * to an embeddable form for the common providers. Anything that is not a plain
 * http(s) URL is ignored, so the section hides itself rather than break.
 */
function resolveVideoSrc(embed?: string): string | null {
    const value = embed?.trim();
    if (!value) {
        return null;
    }

    const iframeSrc = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1];
    const candidate = (iframeSrc ?? value).trim();

    if (!/^https?:\/\//i.test(candidate)) {
        return null;
    }

    return normalizeEmbedUrl(candidate);
}

function normalizeEmbedUrl(url: string): string {
    try {
        const parsed = new URL(url);

        // Convert YouTube watch/share links to their /embed/<id> form.
        if (parsed.hostname.includes('youtube.com')) {
            const id = parsed.searchParams.get('v');
            if (id) {
                return `https://www.youtube.com/embed/${id}`;
            }
        }
        if (parsed.hostname === 'youtu.be') {
            const id = parsed.pathname.slice(1);
            if (id) {
                return `https://www.youtube.com/embed/${id}`;
            }
        }

        return url;
    } catch {
        return url;
    }
}

interface AboutVideoSectionProps {
    embed: string;
    title?: string;
}

export default function AboutVideoSection({
    embed,
    title,
}: AboutVideoSectionProps) {
    const { t } = useTranslation();
    const src = resolveVideoSrc(embed);

    if (!src) {
        return null;
    }

    return (
        <section className="space-y-8">
            <AboutSectionHeading
                eyebrow={t('about.videoEyebrow')}
                title={t('about.videoTitle')}
            />
            <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-brand-border bg-brand-soft p-3 shadow-sm">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                    <iframe
                        src={src}
                        title={
                            title
                                ? `${title} — ${t('about.videoTitle')}`
                                : t('about.videoTitle')
                        }
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            </div>
        </section>
    );
}
