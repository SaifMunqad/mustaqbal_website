import FooterBottom from '@/components/general/footer/footer-bottom';
import FooterBrand from '@/components/general/footer/footer-brand';
import FooterLinkSection from '@/components/general/footer/footer-link-section';
import { footerSections } from '@/lib/navigation';

export default function Footer() {
    return (
        <div className="mb-3">
            <footer className="rounded-2xl bg-gray-100 px-4 py-2 shadow-md backdrop-blur-lg backdrop-saturate-150 lg:px-8 lg:py-3 dark:bg-gray-800">
                <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
                        <div className="md:col-span-1">
                            <FooterBrand />
                        </div>

                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 md:col-span-3 md:grid-cols-3">
                            {footerSections.map((section) => (
                                <FooterLinkSection key={section.key} section={section} />
                            ))}
                        </div>
                    </div>

                    <hr className="my-6 border-gray-200 sm:mx-auto lg:my-8 dark:border-gray-700" />
                    <FooterBottom />
                </div>
            </footer>
        </div>
    );
}
