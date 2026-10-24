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
import { useTranslation } from 'react-i18next';

export interface TypeOption {
    value: string;
    label: string;
    kind: 'curated' | 'authored';
}

export interface AvailableItem {
    id: number;
    label: string;
}

// The localized fields are built inside the component so their labels follow
// the active UI language. Curated sections only carry a section title; authored
// blocks also have heading / body / button label.

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
    { value: 'default', labelKey: 'homeBuilder.tones.default' },
    { value: 'blue', labelKey: 'homeBuilder.tones.blue' },
    { value: 'green', labelKey: 'homeBuilder.tones.green' },
    { value: 'amber', labelKey: 'homeBuilder.tones.amber' },
    { value: 'red', labelKey: 'homeBuilder.tones.red' },
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
    const { t } = useTranslation();
    const titleField: TranslatableField = {
        name: 'title',
        label: t('homeBuilder.form.titleLabel'),
        type: 'text',
        hint: t('homeBuilder.form.titleHint'),
        required: false,
    };
    const authoredFields: TranslatableField[] = [
        titleField,
        {
            name: 'heading',
            label: t('homeBuilder.form.heading'),
            type: 'text',
            required: false,
        },
        {
            name: 'body',
            label: t('homeBuilder.form.body'),
            type: 'textarea',
            rows: 4,
            required: false,
        },
        {
            name: 'cta_label',
            label: t('homeBuilder.form.buttonLabel'),
            type: 'text',
            required: false,
        },
    ];
    const curatedFields: TranslatableField[] = [titleField];
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
                        title={t('homeBuilder.form.sectionType')}
                        description={t(
                            'homeBuilder.form.sectionTypeDescription',
                        )}
                        icon={<CircleStackIcon className="size-5" />}
                    >
                        <SelectField
                            label={t('homeBuilder.form.type')}
                            name="section_type"
                            required
                            defaultValue={form.data.section_type}
                            options={typeOptions.map(({ value, label }) => ({
                                value,
                                label,
                                labelKey: `enums.sectionType.${value}`,
                            }))}
                            onChange={handleTypeChange}
                            error={form.errors.section_type}
                            hint={
                                isCurated
                                    ? t('homeBuilder.form.curatedHint')
                                    : t('homeBuilder.form.homeOnlyHint')
                            }
                        />
                    </FormSection>

                    {isCurated ? (
                        <FormSection
                            title={t('homeBuilder.form.choose')}
                            description={t(
                                'homeBuilder.form.chooseDescription',
                            )}
                            icon={<RectangleStackIcon className="size-5" />}
                        >
                            <TextField
                                label={t('homeBuilder.form.limit')}
                                name="limit"
                                type="number"
                                min={1}
                                max={12}
                                value={form.data.limit}
                                onChange={(event) => form.setData('limit', event.target.value)}
                                error={form.errors.limit}
                                hint={t('homeBuilder.form.limitHint')}
                            />

                            {candidates.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t('homeBuilder.form.noItems')}
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
                            title={t('homeBuilder.form.media')}
                            description={t(
                                'homeBuilder.form.mediaDescription',
                            )}
                            icon={<PhotoIcon className="size-5" />}
                            columns={2}
                        >
                            <div className="md:col-span-2">
                                <ImageUploadField
                                    label={t('homeBuilder.form.image')}
                                    name="image_url"
                                    value={form.data.config.image_url}
                                    onChange={(value) => setConfig({ image_url: value })}
                                    error={form.errors['config.image_url']}
                                />
                            </div>
                            <TextField
                                label={t('homeBuilder.form.buttonLink')}
                                name="cta_url"
                                placeholder={t(
                                    'homeBuilder.form.buttonLinkPlaceholder',
                                )}
                                value={form.data.config.cta_url}
                                onChange={(event) => setConfig({ cta_url: event.target.value })}
                                error={form.errors['config.cta_url']}
                                hint={t('homeBuilder.form.buttonLinkHint')}
                            />
                        </FormSection>
                    )}

                    <FormSection
                        title={t('homeBuilder.form.localized')}
                        description={t(
                            'homeBuilder.form.localizedDescription',
                        )}
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
                    <FormSection title={t('homeBuilder.form.appearance')}>
                        {!isCurated ? (
                            <SelectField
                                label={t('homeBuilder.form.tone')}
                                name="tone"
                                defaultValue={form.data.config.tone}
                                options={toneOptions}
                                onChange={(value) => setConfig({ tone: value })}
                                error={form.errors['config.tone']}
                            />
                        ) : null}
                        <CheckboxField
                            label={t('homeBuilder.form.active')}
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
                            if (window.confirm(t('homeBuilder.form.deleteConfirm'))) {
                                router.delete(deleteUrl);
                            }
                        }}
                    >
                        {t('homeBuilder.form.delete')}
                    </Button>
                ) : null}
            </StickyFormFooter>
        </form>
    );
}
