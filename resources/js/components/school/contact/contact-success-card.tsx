import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function ContactSuccessCard({ onSendAnother }: { onSendAnother: () => void }) {
    const { t } = useTranslation();

    return (
        <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12 dark:border-slate-800 dark:bg-gray-900">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircleIcon className="size-9" aria-hidden />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                {t('contact.title')}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
                {t('contact.successMessage')}
            </p>
            <button
                type="button"
                onClick={onSendAnother}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
                {t('contact.sendAnother')}
            </button>
        </section>
    );
}
