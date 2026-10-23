import type { TypeOption } from '@/components/dashboard/home-section-form';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddSectionSidebarProps {
    typeOptions: TypeOption[];
    onAdd: (option: TypeOption) => void;
}

/**
 * A persistent sidebar of block types for the home visual editor — a drop-in
 * replacement for the "+ Add section" dropdown. Every option shows a small
 * skeleton of the section it will place, so the admin recognizes the shape
 * before adding it. Clicking appends a draft (the same flow the dropdown used).
 */
export default function AddSectionSidebar({
    typeOptions,
    onAdd,
}: AddSectionSidebarProps) {
    const { t } = useTranslation();

    return (
        <aside className="order-first lg:order-last lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {t('dashboard.homeSections.visual.addSection', 'Add section')}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {typeOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onAdd(option)}
                        className="group w-full overflow-hidden rounded-lg border border-border bg-card text-start transition hover:border-blue-400 hover:shadow-sm"
                    >
                        <SectionSkeleton value={option.value} />
                        <span className="flex items-center justify-between gap-2 px-3 py-1.5">
                            <span className="truncate text-xs font-medium">
                                {t(`enums.homeSectionType.${option.value}`, option.label)}
                            </span>
                            <Plus className="size-3.5 shrink-0 text-muted-foreground transition group-hover:text-blue-500" />
                        </span>
                    </button>
                ))}
            </div>
            <p className="mt-3 hidden text-xs text-muted-foreground lg:block">
                {t(
                    'dashboard.homeSections.visual.sidebarHint',
                    'Click a block to add it to the page.',
                )}
            </p>
        </aside>
    );
}

// A tiny wireframe per HomeSectionType so the palette shows the shape, not just
// the name. Card rails (articles/events/recognition) share one grid mock.
function SectionSkeleton({ value }: { value: string }) {
    const bar = 'rounded bg-muted-foreground/20';
    const box = 'rounded bg-muted-foreground/15';

    const preview: Record<string, React.ReactNode> = {
        banner: (
            <div className="space-y-1">
                <div className={`h-3 w-2/3 ${bar}`} />
                <div className={`h-6 w-full ${box}`} />
            </div>
        ),
        announcement: (
            <div className="space-y-1">
                <div className={`h-3 w-1/2 ${bar}`} />
                <div className={`h-2 w-full ${bar}`} />
                <div className={`h-2 w-3/4 ${bar}`} />
            </div>
        ),
    };

    return (
        <div className="h-16 w-full border-b border-border bg-muted/40 p-2">
            {preview[value] ?? (
                <div className="space-y-1">
                    <div className={`h-2 w-1/3 ${bar}`} />
                    <div className="grid grid-cols-3 gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={`h-7 ${box}`} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
