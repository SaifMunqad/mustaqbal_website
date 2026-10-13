import { useTranslation } from 'react-i18next';
import { Eye, Target, type LucideIcon } from 'lucide-react';
import { ACCENTS } from '@/components/school/about/about-constants';
import { cn } from '@/lib/utils';

interface AboutMissionVisionProps {
    mission?: string;
    vision?: string;
}

export default function AboutMissionVision({ mission, vision }: AboutMissionVisionProps) {
    const { t } = useTranslation();

    if (!mission && !vision) {
        return null;
    }

    const cards = [
        mission
            ? { key: 'mission', Icon: Target, accent: ACCENTS[0], title: t('about.missionTitle'), text: mission }
            : null,
        vision
            ? { key: 'vision', Icon: Eye, accent: ACCENTS[1], title: t('about.visionTitle'), text: vision }
            : null,
    ].filter(Boolean) as { key: string; Icon: LucideIcon; accent: string; title: string; text: string }[];

    return (
        <section className="grid gap-5 md:grid-cols-2">
            {cards.map(({ key, Icon, accent, title, text }) => (
                <div
                    key={key}
                    className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-gray-900"
                >
                    <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', accent)}>
                        <Icon className="size-6" aria-hidden />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">{text}</p>
                    </div>
                </div>
            ))}
        </section>
    );
}
