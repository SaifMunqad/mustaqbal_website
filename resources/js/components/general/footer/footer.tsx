/**
 * Public site footer shell.
 *
 * Lays out the four-column grid (brand column plus the link sections declared in
 * `lib/navigation`) and ends with the legal/social bar. All copy and links come
 * from the shared site settings, so the footer follows admin edits without a
 * code change.
 */
import FooterBottom from '@/components/general/footer/footer-bottom';
import FooterBrand from '@/components/general/footer/footer-brand';
import FooterLinkSection from '@/components/general/footer/footer-link-section';
import { footerSections } from '@/lib/navigation';

export default function Footer() {
    return (
        <div className="">
            <footer className="bg-brand-soft px-4 py-2 shadow-md backdrop-blur-lg backdrop-saturate-150 lg:px-8 lg:py-3">
                <div className="mx-auto w-full max-w-400 p-4 py-6 lg:py-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
                        <div className="md:col-span-1">
                            <FooterBrand />
                        </div>

                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 md:col-span-3 md:grid-cols-3">
                            {footerSections.map((section) => (
                                <FooterLinkSection
                                    key={section.key}
                                    section={section}
                                />
                            ))}
                        </div>
                    </div>

                    <hr className="my-6 border-brand-border sm:mx-auto lg:my-8" />
                    <FooterBottom />
                </div>
            </footer>
        </div>
    );
}
