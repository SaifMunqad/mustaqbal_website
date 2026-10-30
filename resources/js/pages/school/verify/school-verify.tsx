/**
 * Certificate/award verification.
 *
 * The visitor submits an identifier and the server resolves it to a stored award.
 * Rate limiting is enforced server-side; the page surfaces the remaining-attempt
 * state (`blocked`, attempts left) rather than letting the form fail silently.
 */
import Reveal from '@/components/ui/reveal';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import MainLayout from '@/layouts/app/main-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface VerifiedAward {
    person_id: string;
    award_id: string;
    full_name: string;
    father_name?: string | null;
    awarded_at?: string | null;
}

interface SchoolVerifyProps {
    query: { person_id: string; award_id: string };
    submitted: boolean;
    award: VerifiedAward | null;
    // Present once the visitor has failed a few lookups from this IP.
    captcha: { question: string } | null;
    captchaError: boolean;
    // Set when one person ID has been guessed too many times.
    blocked: boolean;
    retryAfterMinutes: number | null;
    [key: string]: unknown;
}

const fieldClass =
    'w-full rounded-2xl border border-brand-border bg-app-bg px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';

function SchoolVerify() {
    const {
        query,
        submitted,
        award,
        captcha,
        captchaError,
        blocked,
        retryAfterMinutes,
    } = usePage<SchoolVerifyProps>().props;
    const { t } = useTranslation();

    // Submitted over POST so the codes never end up in a URL, in browser
    // history, or in the referrer sent to third parties.
    const form = useForm({
        person_id: query.person_id,
        award_id: query.award_id,
        captcha_answer: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post('/school/verify', {
            preserveScroll: true,
            // Every attempt issues a new challenge, so the previous answer must
            // not be resubmitted with it.
            onSuccess: () => form.reset('captcha_answer'),
        });
    };

    const formatDate = useDateFormatter({ dateStyle: 'long' });

    return (
        <>
            <Head title={t('verify.title')}>
                {/* Results are personal records; keep them out of search engines. */}
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <section className="mx-auto max-w-3xl space-y-6">
                <Reveal direction="fade" defaultInView>
                    <div className="text-center">
                        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-brand-soft-strong text-brand-ink dark:bg-brand-deep">
                            <ShieldCheck className="size-7" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {t('verify.title')}
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            {t('verify.subtitle')}
                        </p>
                    </div>
                </Reveal>

                {blocked ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950">
                        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                            {t('verify.blockedTitle')}
                        </h2>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                            {t('verify.blockedBody', {
                                minutes: retryAfterMinutes ?? 15,
                            })}
                        </p>
                    </div>
                ) : (
                    <form
                        onSubmit={submit}
                        className="grid gap-4 rounded-2xl border border-brand-border bg-brand-soft p-5 shadow-sm md:grid-cols-2"
                    >
                        <label className="grid gap-2 text-sm">
                            <span className="font-medium">
                                {t('verify.personId')}
                            </span>
                            <input
                                type="text"
                                value={form.data.person_id}
                                onChange={(event) =>
                                    form.setData(
                                        'person_id',
                                        event.target.value,
                                    )
                                }
                                required
                                maxLength={64}
                                placeholder={t('verify.personIdPlaceholder')}
                                className={fieldClass}
                            />
                            {form.errors.person_id ? (
                                <span className="text-sm text-red-600 dark:text-red-400">
                                    {form.errors.person_id}
                                </span>
                            ) : null}
                        </label>
                        <label className="grid gap-2 text-sm">
                            <span className="font-medium">
                                {t('verify.awardId')}
                            </span>
                            <input
                                type="text"
                                value={form.data.award_id}
                                onChange={(event) =>
                                    form.setData('award_id', event.target.value)
                                }
                                required
                                maxLength={64}
                                placeholder={t('verify.awardIdPlaceholder')}
                                className={fieldClass}
                            />
                            {form.errors.award_id ? (
                                <span className="text-sm text-red-600 dark:text-red-400">
                                    {form.errors.award_id}
                                </span>
                            ) : null}
                        </label>

                        {captcha ? (
                            <label className="grid gap-2 text-sm md:col-span-2">
                                <span className="font-medium">
                                    {t('verify.captchaLabel')}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {t('verify.captchaQuestion', {
                                        question: captcha.question,
                                    })}
                                </span>
                                <input
                                    type="text"
                                    value={form.data.captcha_answer}
                                    onChange={(event) =>
                                        form.setData(
                                            'captcha_answer',
                                            event.target.value,
                                        )
                                    }
                                    required
                                    inputMode="numeric"
                                    maxLength={4}
                                    autoComplete="off"
                                    className={fieldClass}
                                />
                                {captchaError ? (
                                    <span className="text-sm text-red-600 dark:text-red-400">
                                        {t('verify.captchaWrong')}
                                    </span>
                                ) : null}
                            </label>
                        ) : null}

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-2xl bg-brand px-6 py-2.5 text-sm font-medium text-brand-fg transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {t('verify.submit')}
                            </button>
                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                {t('verify.hint')}
                            </p>
                        </div>
                    </form>
                )}

                {submitted && award ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                                    {t('verify.foundTitle')}
                                </h2>
                                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                                    {t('verify.foundBody')}
                                </p>
                            </div>
                        </div>

                        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                            {[
                                [t('verify.holder'), award.full_name],
                                [
                                    t('verify.fatherName'),
                                    award.father_name || '-',
                                ],
                                [t('verify.personId'), award.person_id],
                                [t('verify.awardId'), award.award_id],
                                [
                                    t('verify.awardedAt'),
                                    formatDate(award.awarded_at),
                                ],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-xl bg-white/70 p-3 dark:bg-black/20"
                                >
                                    <dt className="text-xs text-emerald-700 dark:text-emerald-300">
                                        {label}
                                    </dt>
                                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ) : null}

                {submitted && !award && !captchaError && !blocked ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
                        <div className="flex items-center gap-3">
                            <XCircle className="size-8 text-red-600 dark:text-red-400" />
                            <div>
                                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                                    {t('verify.notFoundTitle')}
                                </h2>
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    {t('verify.notFoundBody')}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    {t('verify.contactNote')}
                </p>
            </section>
        </>
    );
}

SchoolVerify.layout = (page: ReactNode) => <MainLayout children={page} />;

export default SchoolVerify;
