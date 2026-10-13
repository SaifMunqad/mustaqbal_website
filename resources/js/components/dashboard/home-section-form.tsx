import FormSection from '@/components/form/form-section';
import StickyFormFooter from '@/components/form/sticky-form-footer';
import {
    CheckboxField,
    SelectField,
    TextAreaField,
    TextField,
} from '@/components/form-fields';
import { ImageUploadField } from '@/components/form/image-upload-field';
import { Button } from '@/components/ui/button';
import { router, useForm } from '@inertiajs/react';
import {
    CircleStackIcon,
    PhotoIcon,
    RectangleStackIcon,
    SparklesIcon,
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

export interface HomeSectionFormData {
    section_type: string;
    title: string;
    limit: string;
    is_active: boolean;
    config: {
        item_ids: number[];
        heading: string;
        body: string;
        image_url: string;
        cta_label: string;
        cta_url: string;
        tone: string;
    };
}

interface HomeSectionFormProps {
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    cancelHref: string;
    typeOptions: TypeOption[];
    availableItems: Record<string, AvailableItem[]>;
    initial: Partial<HomeSectionFormData> & { config?: Partial<HomeSectionFormData['config']> };
    deleteUrl?: string;
    toastOnError?: (errors: Record<string, unknown>) => void;
}

const toneOptions: TypeOption[] = [
    { value: 'default', label: 'Default', kind: 'authored' },
    { value: 'blue', label: 'Blue', kind: 'authored' },
    { value: 'green', label: 'Green', kind: 'authored' },
    { value: 'amber', label: 'Amber', kind: 'authored' },
    { value: 'red', label: 'Red', kind: 'authored' },
];

function mergeInitial(
    initial: HomeSectionFormProps['initial'],
): HomeSectionFormData {
    return {
        section_type: initial.section_type ?? 'articles',
        title: initial.title ?? '',
        limit: initial.limit != null ? String(initial.limit) : '',
        is_active: initial.is_active ?? true,
        config: {
            item_ids: initial.config?.item_ids ?? [],
            heading: initial.config?.heading ?? '',
            body: initial.config?.body ?? '',
            image_url: initial.config?.image_url ?? '',
            cta_label: initial.config?.cta_label ?? '',
            cta_url: initial.config?.cta_url ?? '',
            tone: initial.config?.tone ?? 'default',
        },
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

                        <TextField
                            label="Section heading (optional)"
                            name="title"
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.target.value)}
                            error={form.errors.title}
                            hint="Shown above this block on the home page."
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
                        <>
                            <FormSection
                                title="Content"
                                icon={<SparklesIcon className="size-5" />}
                            >
                                <TextField
                                    label="Heading"
                                    name="config.heading"
                                    value={form.data.config.heading}
                                    onChange={(event) =>
                                        form.setData((data) => ({
                                            ...data,
                                            config: { ...data.config, heading: event.target.value },
                                        }))
                                    }
                                    error={form.errors['config.heading']}
                                />
                                <TextAreaField
                                    label="Body"
                                    name="config.body"
                                    className="h-28"
                                    value={form.data.config.body}
                                    onChange={(event) =>
                                        form.setData((data) => ({
                                            ...data,
                                            config: { ...data.config, body: event.target.value },
                                        }))
                                    }
                                    error={form.errors['config.body']}
                                />
                            </FormSection>

                            <FormSection
                                title="Media & call to action"
                                icon={<PhotoIcon className="size-5" />}
                                columns={2}
                            >
                                <div className="md:col-span-2">
                                    <ImageUploadField
                                        label="Image"
                                        name="config.image_url"
                                        value={form.data.config.image_url}
                                        onChange={(value) =>
                                            form.setData((data) => ({
                                                ...data,
                                                config: { ...data.config, image_url: value },
                                            }))
                                        }
                                        error={form.errors['config.image_url']}
                                    />
                                </div>
                                <TextField
                                    label="Button label"
                                    name="config.cta_label"
                                    value={form.data.config.cta_label}
                                    onChange={(event) =>
                                        form.setData((data) => ({
                                            ...data,
                                            config: { ...data.config, cta_label: event.target.value },
                                        }))
                                    }
                                    error={form.errors['config.cta_label']}
                                />
                                <TextField
                                    label="Button link"
                                    name="config.cta_url"
                                    placeholder="/school/programs"
                                    value={form.data.config.cta_url}
                                    onChange={(event) =>
                                        form.setData((data) => ({
                                            ...data,
                                            config: { ...data.config, cta_url: event.target.value },
                                        }))
                                    }
                                    error={form.errors['config.cta_url']}
                                    hint="Relative path or full URL."
                                />
                            </FormSection>
                        </>
                    )}
                </div>

                <aside className="space-y-4">
                    <FormSection title="Appearance & status">
                        {!isCurated ? (
                            <SelectField
                                label="Tone"
                                name="tone"
                                defaultValue={form.data.config.tone}
                                options={toneOptions.map(({ value, label }) => ({ value, label }))}
                                onChange={(value) =>
                                    form.setData((data) => ({
                                        ...data,
                                        config: { ...data.config, tone: value },
                                    }))
                                }
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
