import { MapPinIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import type { SiteSettings } from '@/types';

interface ContactMapSectionProps {
    contact: NonNullable<SiteSettings['contact']>;
}

// Embedded location map with a "get directions" link. Hides itself entirely when
// no map embed URL has been configured.
export default function ContactMapSection({ contact }: ContactMapSectionProps) {
    const { t } = useTranslation();

    if (!contact.map_embed_url) {
        return null;
    }

    const directionsUrl =
        contact.map_latitude != null && contact.map_longitude != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${contact.map_latitude},${contact.map_longitude}`
            : contact.address
              ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`
              : null;

    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {t('contact.visitingTitle')}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {t('contact.visitingText')}
                    </p>
                </div>
                {directionsUrl ? (
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-800"
                    >
                        <MapPinIcon className="size-4" aria-hidden />
                        {t('contact.getDirections')}
                    </a>
                ) : null}
            </div>
            <iframe
                title={t('contact.mapTitle')}
                src={contact.map_embed_url}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-80 w-full border-0"
            />
        </section>
    );
}
