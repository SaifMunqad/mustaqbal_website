import { cn } from '@/lib/utils';
import {
    BookOpen,
    CalendarDays,
    GraduationCap,
    MapPin,
    MoonStar,
    Users,
    Wallet,
    type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type ProgramType = 'school' | 'courses' | 'islamic_madrasa';

export interface Program {
    id: number;
    name: string;
    program_type: ProgramType;
    program_type_label: string;
    description: string;
    schedule: string;
    fees: string;
    age_recommendation: string;
    classroom_number?: string | null;
    available_for_enroll: boolean;
}

interface TypeAccent {
    icon: LucideIcon;
    /** Tinted tile that frames the leading icon. */
    tile: string;
    /** Soft ring/border highlight used on hover. */
    ring: string;
}

/**
 * Per-category visual identity. Both the program card and the "how the programs
 * fit together" pathway read from this single map so the accents stay consistent.
 * Textual labels live in the i18n bundles (`programs.categories.*`).
 */
export const PROGRAM_ACCENTS: Record<ProgramType, TypeAccent> = {
    school: {
        icon: GraduationCap,
        tile: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
        ring: 'hover:border-blue-300 dark:hover:border-blue-500/50',
    },
    courses: {
        icon: BookOpen,
        tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
        ring: 'hover:border-blue-300 dark:hover:border-blue-500/50',
    },
    islamic_madrasa: {
        icon: MoonStar,
        tile: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
        ring: 'hover:border-blue-300 dark:hover:border-blue-500/50',
    },
};

function MetaRow({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Icon
                className="size-4 shrink-0 text-slate-400 dark:text-slate-500"
                aria-hidden
            />
            <span className="text-slate-500 dark:text-slate-400">{label}:</span>
            <span
                className="truncate font-medium text-slate-800 dark:text-slate-100"
                title={value}
            >
                {value}
            </span>
        </div>
    );
}

/**
 * Redesigned program card: a leading icon tile, a type badge, icon-led
 * metadata rows and an enrollment status pill. Flex column + mt-auto footer
 * keeps cards aligned.
 */
export default function ProgramCard({ program }: { program: Program }) {
    const { t } = useTranslation();
    const accent = PROGRAM_ACCENTS[program.program_type];
    const Icon = accent.icon;

    return (
        <article
            className={cn(
                'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition',
                'hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900',
                accent.ring,
            )}
        >
            <div className="flex flex-1 flex-col gap-4 p-5">
                <header className="flex items-start gap-3">
                    <div
                        className={cn(
                            'flex size-12 shrink-0 items-center justify-center rounded-xl',
                            accent.tile,
                        )}
                    >
                        <Icon className="size-6" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg leading-snug font-semibold text-slate-900 dark:text-white">
                            {program.name}
                        </h3>
                        <span
                            className={cn(
                                'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                accent.tile,
                            )}
                        >
                            {program.program_type_label}
                        </span>
                    </div>
                </header>

                <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                    {program.description}
                </p>

                <div className="mt-auto space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <MetaRow
                        icon={CalendarDays}
                        label={t('programs.schedule')}
                        value={program.schedule}
                    />
                    <MetaRow
                        icon={Wallet}
                        label={t('programs.fees')}
                        value={program.fees}
                    />
                    <MetaRow
                        icon={Users}
                        label={t('programs.age')}
                        value={program.age_recommendation}
                    />
                    <MetaRow
                        icon={MapPin}
                        label={t('programs.classroom')}
                        value={
                            program.classroom_number ??
                            t('programs.toBeAnnounced')
                        }
                    />
                </div>

                <footer className="flex items-center justify-end gap-2">
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                            program.available_for_enroll
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400',
                        )}
                    >
                        <span
                            className={cn(
                                'size-1.5 rounded-full',
                                program.available_for_enroll
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-400',
                            )}
                        />
                        {program.available_for_enroll
                            ? t('programs.enrollmentOpen')
                            : t('programs.enrollmentClosed')}
                    </span>
                </footer>
            </div>
        </article>
    );
}
