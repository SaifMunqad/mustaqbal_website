import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

/**
 * Admissions call-to-action band that closes the home page. Copy is i18n-driven
 * and the buttons point at the enrollment and contact pages.
 */
export default function CtaBand() {
    const { t } = useTranslation();

    return (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-emerald-600 shadow-md">
            <div className="flex flex-col items-center gap-5 p-8 text-center md:flex-row md:justify-between md:p-10 md:text-start">
                <div>
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                        {t('home.admissionsTitle')}
                    </h2>
                    <p className="mt-2 max-w-2xl text-blue-50">
                        {t('home.admissionsSubtitle')}
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-center gap-3">
                    {/*<Link
                        href="/school/enroll"
                        className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                    >
                        {t('home.admissionsCta')}
                    </Link>*/}
                    <Link
                        href="/school/contact"
                        className="rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        {t('home.admissionsSecondary')}
                    </Link>
                </div>
            </div>
        </section>
    );
}
