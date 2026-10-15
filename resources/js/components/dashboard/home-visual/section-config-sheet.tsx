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

const toneOptions = [
    { value: 'default', label: 'Default' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'amber', label: 'Amber' },
    { value: 'red', label: 'Red' },
];

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
    if (!draft) {
        return null;
    }

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
                    <SheetTitle>{draft.type_label} · Settings</SheetTitle>
                    <SheetDescription>
                        Shared across all languages. Text is edited by clicking it
                        on the page.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 p-4 pt-2">
                    {isCurated ? (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="limit">Number to show when auto</Label>
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
                                    Used only when no specific items are picked.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label>Pick specific items</Label>
                                {candidates.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No publishable items available for this type yet.
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
                                label="Image"
                                name="image_url"
                                value={draft.config.image_url}
                                onChange={(value) => onPatchConfig({ image_url: value })}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="cta_url">Button link</Label>
                                <Input
                                    id="cta_url"
                                    value={draft.config.cta_url}
                                    placeholder="/school/programs"
                                    onChange={(event) =>
                                        onPatchConfig({ cta_url: event.target.value })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Relative path or full URL. The button label is
                                    edited on the page.
                                </p>
                            </div>

                            <SelectField
                                key={`${draft.key}-tone`}
                                label="Tone"
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
