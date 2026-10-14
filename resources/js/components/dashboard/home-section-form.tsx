import FormSection from '@/components/form/form-section';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import { CheckboxField, SelectField, TextField } from '@/components/form-fields';
import { ImageUploadField } from '@/components/form/image-upload-field';
import LanguageTabsEditor, {
    type TranslatableField,
    type TranslationValues,
} from '@/components/language-tabs-editor';
import { Button } from '@/components/ui/button';
import { router, useForm } from '@inertiajs/react';
import {
    CircleStackIcon,
    DocumentTextIcon,
    PhotoIcon,
    RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export interface TypeOption {
    value: string;
    label: string;
    kind: 'curated' | 'authored';
}

export interface AvailableItem {
    id: number;
    label: string;
}

// The localized fields rendered per language. Curated sections only carry a
// section title; authored blocks also have heading / body / button label.
const titleField: TranslatableField = {
    name: 'title',
    label: 'Section heading (optional)',
    type: 'text',
    hint: 'Shown above this block on the home page.',
    required: false,
};

const authoredFields: TranslatableField[] = [
    titleField,
    { name: 'heading', label: 'Heading', type: 'text', required: false },
    { name: 'body', label: 'Body', type: 'textarea', rows: 4, required: false },
    { name: 'cta_label', label: 'Button label', type: 'text', required: false },
];

const curatedFields: TranslatableField[] = [titleField];

// Parent (non-localized) config shape persisted on the row.
interface HomeSectionParentConfig {
    item_ids: number[];
    image_url: string;
    cta_url: string;
    tone: string;
}

export interface HomeSectionFormData {
    section_type: string;
    limit: string;
    is_active: boolean;
    config: HomeSectionParentConfig;
    translations: TranslationValues;
}

interface HomeSectionFormProps {
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    cancelHref: string;
    typeOptions: TypeOption[];
    availableItems: Record<string, AvailableItem[]>;
    initial: Partial<HomeSectionFormData>;
    deleteUrl?: string;
    toastOnError?: (errors: Record<string, unknown>) => void;
}

const toneOptions = [
    { value: 'default', label: 'Default' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'amber', label: 'Amber' },
    { value: 'red', label: 'Red' },
];

function mergeInitial(
    initial: HomeSectionFormProps['initial'],
): HomeSectionFormData {
    return {
        section_type: initial.section_type ?? 'articles',
        limit: initial.limit != null ? String(initial.limit) : '',
        is_active: initial.is_active ?? true,
        config: {
            item_ids: initial.config?.item_ids ?? [],
            image_url: initial.config?.image_url ?? '',
            cta_url: initial.config?.cta_url ?? '',
            tone: initial.config?.tone ?? 'default',
        },
        translations: initial.translations ?? {},
    };
}

export default function HomeSectionForm({
    action,
    method,
    submitLabel,
    cancelHref,
    typeOptions,
    availableItems,
    initial,
    deleteUrl,
    toastOnError,
}: HomeSectionFormProps) {
    const [selectedType, setSelectedType] = useState(initial.section_type ?? 'articles');
    const form = useForm<HomeSectionFormData>(mergeInitial(initial));

    const activeOption = typeOptions.find((option) => option.value === selectedType);
    const isCurated = activeOption?.kind === 'curated';
    const candidates = availableItems[selectedType] ?? [];
    const picked = form.data.config.item_ids;

    const handleTypeChange = (value: string) => {
        setSelectedType(value);
        form.setData((data) => ({ ...data, section_type: value }));
    };

    const setConfig = (patch: Partial<HomeSectionParentConfig>) => {
        form.setData((data) => ({ ...data, config: { ...data.config, ...patch } }));
    };

    const toggleItem = (id: number) => {
        form.setData((data) => {
            const exists = data.config.item_ids.includes(id);
            const item_ids = exists
                ? data.config.item_ids.filter((item) => item !== id)
                : [...data.config.item_ids, id];
            return { ...data, config: { ...data.config, item_ids } };
        });
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.submit(method, action, {
                    preserveScroll: true,
                    onError: toastOnError,
                });
            }}
            className="space-y-4"
        >
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-4">
                    <FormSection
                        title="Section type"
                        description="Pull existing content onto the home page, or create a home-only block."
                        icon={<CircleStackIcon className="size-5" />}
                    >
                        <SelectField
                            label="Type"
                            name="section_type"
                            required
                            defaultValue={form.data.section_type}
                            options={typeOptions.map(({ value, label }) => ({ value, label }))}
                            onChange={handleTypeChange}
                            error={form.errors.section_type}
                            hint={
                                isCurated
                                    ? 'Curated: references live content and stays in sync with its source.'
                                    : 'Home-only: create content that appears only on the home page.'
                            }
                        />
                    </FormSection>

                    {isCurated ? (
                        <FormSection
                            title="Choose what to feature"
                            description="Pick specific items, or leave empty to auto-show the latest."
                            icon={<RectangleStackIcon className="size-5" />}
                        >
                            <TextField
                                label="Number to show when auto"
                                name="limit"
                                type="number"
                                min={1}
                                max={12}
                                value={form.data.limit}
                                onChange={(event) => form.setData('limit', event.target.value)}
                                error={form.errors.limit}
                                hint="Used only when no specific items are picked. Default 3."
                            />

                            {candidates.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No publishable items available for this type yet.
                                </p>
                            ) : (
                                <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-border p-3">
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
                        </FormSection>
                    ) : (
                        <FormSection
                            title="Media & call to action"
                            description="Shared across all languages. Translate the button label in the content section below."
                            icon={<PhotoIcon className="size-5" />}
                            columns={2}
                        >
                            <div className="md:col-span-2">
                                <ImageUploadField
                                    label="Image"
                                    name="image_url"
                                    value={form.data.config.image_url}
                                    onChange={(value) => setConfig({ image_url: value })}
                                    error={form.errors['config.image_url']}
                                />
                            </div>
                            <TextField
                                label="Button link"
                                name="cta_url"
                                placeholder="/school/programs"
                                value={form.data.config.cta_url}
                                onChange={(event) => setConfig({ cta_url: event.target.value })}
                                error={form.errors['config.cta_url']}
                                hint="Relative path or full URL."
                            />
                        </FormSection>
                    )}

                    <FormSection
                        title="Localized content"
                        description="Add this block's text for each language. The starred language is the fallback."
                        icon={<DocumentTextIcon className="size-5" />}
                    >
                        <LanguageTabsEditor
                            key={isCurated ? 'curated' : 'authored'}
                            fields={isCurated ? curatedFields : authoredFields}
                            translations={form.data.translations}
                            onChange={(next) => form.setData('translations', next)}
                        />
                    </FormSection>
                </div>

                <aside className="space-y-4">
                    <FormSection title="Appearance & status">
                        {!isCurated ? (
                            <SelectField
                                label="Tone"
                                name="tone"
                                defaultValue={form.data.config.tone}
                                options={toneOptions}
                                onChange={(value) => setConfig({ tone: value })}
                                error={form.errors['config.tone']}
                            />
                        ) : null}
                        <CheckboxField
                            label="Active (shown on home page)"
                            name="is_active"
                            checked={form.data.is_active}
                            onCheckedChange={(checked) =>
                                form.setData('is_active', checked === true)
                            }
                        />
                    </FormSection>
                </aside>
            </div>

            <StickyFormFooter
                submitLabel={submitLabel}
                processing={form.processing}
                cancelHref={cancelHref}
            >
                {deleteUrl ? (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                            if (window.confirm('Remove this section from the home page?')) {
                                router.delete(deleteUrl);
                            }
                        }}
                    >
                        Delete
                    </Button>
                ) : null}
            </StickyFormFooter>
        </form>
    );
}
