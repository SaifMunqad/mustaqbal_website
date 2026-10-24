/**
 * Public contact page.
 *
 * Shows the admin-authored intro, the contact details column and the map, and swaps
 * the form for a success card once a message has been sent — without leaving the
 * page.
 */
import PageGrid, { type RenderBlock } from '@/components/home/page-block';
import ContactInfoPanel from '@/components/school/contact/contact-info-panel';
import ContactIntroBand from '@/components/school/contact/contact-intro-band';
import ContactMapSection from '@/components/school/contact/contact-map-section';
import ContactMessageForm from '@/components/school/contact/contact-message-form';
import ContactSuccessCard from '@/components/school/contact/contact-success-card';
import Reveal from '@/components/ui/reveal';
import MainLayout from '@/layouts/app/main-layout';
import type { SiteSettings } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ContactPageData {
    title: string;
    content?: { body?: string };
}

function SchoolContact() {
    const { t, i18n } = useTranslation();
    const { page, site, blocks } = usePage<{
        page: ContactPageData | null;
        site: SiteSettings;
        blocks?: RenderBlock[];
    }>().props;

    // Authored layout from the unified page builder. Empty until the contact
    // page has blocks (or the contact backfill seeder has run), in which case
    // the view keeps rendering the legacy site_pages composition below.
    const builderBlocks = blocks ?? [];
    const heroTitle = builderBlocks.find((block) => block.component === 'hero')
        ?.hero?.title;
    const title = heroTitle || page?.title || t('contact.title');
    const intro = page?.content?.body?.trim();

    const contact = site?.contact ?? {};
    const social = site?.social ?? {};

    const [submitted, setSubmitted] = useState(false);

    if (builderBlocks.length > 0) {
        return (
            <div className="mx-auto max-w-6xl px-4">
                <Head title={title} />
                <PageGrid
                    blocks={builderBlocks}
                    rtl={i18n.dir() === 'rtl' || i18n.language === 'ar'}
                />
            </div>
        );
    }

    if (submitted) {
        return (
            <>
                <Head title={title} />
                <ContactSuccessCard onSendAnother={() => setSubmitted(false)} />
            </>
        );
    }

    return (
        <div className="space-y-6">
            <Head title={title} />

            <Reveal direction="fade" defaultInView>
                <ContactIntroBand title={title} intro={intro} />
            </Reveal>

            <Reveal>
                <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
                    <ContactMessageForm onSuccess={() => setSubmitted(true)} />
                    <ContactInfoPanel contact={contact} social={social} />
                </div>
            </Reveal>

            <Reveal>
                <ContactMapSection contact={contact} />
            </Reveal>
        </div>
    );
}

SchoolContact.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolContact;
