import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/form-fields';
import { ImageUploadField } from '@/components/form/image-upload-field';
import type { AvailableItem } from '@/components/dashboard/home-section-form';
import type { DraftConfig, SectionDraft } from './types';
import { useTranslation } from 'react-i18next';

const TONES = ['default', 'blue', 'green', 'amber', 'red'] as const;

interface SectionConfigSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    draft: SectionDraft | null;
    candidates: AvailableItem[];
    onPatchConfig: (patch: Partial<DraftConfig>) => void;
    onPatchLimit: (limit: number | null) => void;
}

/**
 * Slide-over for the non-text settings of a block. Authored blocks expose the
 * shared media/CTA/tone; curated blocks expose the item picker + auto limit.
 * These settings are language-agnostic, so there's nothing to translate here.
 */
export default function SectionConfigSheet({
    open,
    onOpenChange,
    draft,
    candidates,
    onPatchConfig,
    onPatchLimit,
}: SectionConfigSheetProps) {
    const { t } = useTranslation();

    if (!draft) {
        return null;
    }

    const toneOptions = TONES.map((tone) => ({
        value: tone,
        labelKey: `homeBuilder.tones.${tone}`,
    }));

    const isCurated = draft.kind === 'curated';
    const picked = draft.config.item_ids;

    const toggleItem = (id: number) => {
        const next = picked.includes(id)
            ? picked.filter((item) => item !== id)
            : [...picked, id];
        onPatchConfig({ item_ids: next });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>
                        {t('homeBuilder.form.settingsTitle', {
                            type: draft.type_label,
                        })}
                    </SheetTitle>
                    <SheetDescription>
                        {t('homeBuilder.form.settingsDescription')}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 p-4 pt-2">
                    {isCurated ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="limit">
                                    {t('homeBuilder.form.limit')}
                                </Label>
                                <Input
                                    id="limit"
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={draft.limit ?? ''}
                                    placeholder="3"
                                    onChange={(event) =>
                                        onPatchLimit(
                                            event.target.value === ''
                                                ? null
                                                : Number(event.target.value),
                                        )
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('homeBuilder.form.limitHintShort')}
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label>{t('homeBuilder.form.pickItems')}</Label>
                                {candidates.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        {t('homeBuilder.form.noItems')}
                                    </p>
                                ) : (
                                    <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-border p-3">
                                        {candidates.map((item) => (
                                            <label
                                                key={item.id}
                                                className="flex cursor-pointer items-center gap-2 py-1 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={picked.includes(item.id)}
                                                    onChange={() => toggleItem(item.id)}
                                                    className="size-4 rounded border-border"
                                                />
                                                <span>{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <ImageUploadField
                                label={t('homeBuilder.form.image')}
                                name="image_url"
                                value={draft.config.image_url}
                                onChange={(value) => onPatchConfig({ image_url: value })}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="cta_url">
                                    {t('homeBuilder.form.buttonLink')}
                                </Label>
                                <Input
                                    id="cta_url"
                                    value={draft.config.cta_url}
                                    placeholder={t(
                                        'homeBuilder.form.buttonLinkPlaceholder',
                                    )}
                                    onChange={(event) =>
                                        onPatchConfig({ cta_url: event.target.value })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('homeBuilder.form.buttonLinkHintShared')}
                                </p>
                            </div>

                            <SelectField
                                key={`${draft.key}-tone`}
                                label={t('homeBuilder.form.tone')}
                                name="tone"
                                defaultValue={draft.config.tone}
                                options={toneOptions}
                                onChange={(value) => onPatchConfig({ tone: value })}
                            />
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
