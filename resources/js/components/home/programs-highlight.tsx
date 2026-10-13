import ProgramCard, {
    type Program,
} from '@/pages/school/programs/program-card';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

/**
 * Automatic "programs" highlight. Cards are pulled live from the Program model
 * (a small random sample, localized) in ShowcaseController::home, so this stays
 * in sync with the programs an admin manages elsewhere. Renders nothing when
 * there are no programs yet.
 */
export default function ProgramsHighlight({
    programs,
}: {
    programs: Program[];
}) {
    const { t } = useTranslation();

    if (!programs || programs.length === 0) {
        return null;
    }

    return (
        <section className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                        {t('home.programsTitle')}
                    </h2>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                        {t('home.programsSubtitle')}
                    </p>
                </div>
                <Link
                    href="/school/programs"
                    className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
                >
                    {t('home.viewAllPrograms')}
                </Link>
            </header>

            <div className="grid items-start gap-5 md:grid-cols-2">
                {programs.map((program) => (
                    <ProgramCard key={program.id} program={program} />
                ))}
            </div>
        </section>
    );
}
