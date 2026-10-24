import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import {
    ClipboardDocumentIcon,
    EyeIcon,
    PencilSquareIcon,
    PhotoIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface DocumentFrameProps {
    title: string;
    description?: string;
    body: string;
    onBodyChange?: (value: string) => void;
    bodyName?: string;
    images?: string[];
    onImagesChange?: (images: string[]) => void;
    bodyLabel?: string;
    copyText?: string;
    children?: ReactNode;
}

const renderParagraphs = (content: string) =>
    content
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

function DocumentFrame({
    title,
    description,
    body,
    onBodyChange,
    bodyName = 'body',
    images = [],
    onImagesChange,
    bodyLabel,
    copyText,
    children,
}: DocumentFrameProps) {
    const { t } = useTranslation();
    const resolvedBodyLabel = bodyLabel ?? t('editor.body');
    const [mode, setMode] = useState<'write' | 'preview'>('write');
    const [copiedText, copy] = useClipboard();
    const canEdit = typeof onBodyChange === 'function';
    const canManageImages = typeof onImagesChange === 'function';
    const safeImages = useMemo(
        () => images.filter((image) => image.trim().length > 0),
        [images],
    );
    const wordCount = useMemo(
        () => body.trim().split(/\s+/).filter(Boolean).length,
        [body],
    );

    const handleAddImage = () => {
        onImagesChange?.([...images, '']);
    };

    const handleUpdateImage = (index: number, value: string) => {
        if (!onImagesChange) {
            return;
        }

        const nextImages = [...images];
        nextImages[index] = value;
        onImagesChange(nextImages);
    };

    const handleRemoveImage = (index: number) => {
        if (!onImagesChange) {
            return;
        }

        const nextImages = images.filter(
            (_, currentIndex) => currentIndex !== index,
        );
        onImagesChange(nextImages.length ? nextImages : ['']);
    };

    const handleCopy = async () => {
        await copy(copyText ?? body);
    };

    const showImagesColumn = canManageImages || safeImages.length > 0;

    const editableImagesPanel = (
        <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-medium text-foreground">
                        {t('editor.images')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t('editor.imagesHint')}
                    </p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddImage}
                >
                    <PlusIcon className="size-4" aria-hidden="true" />
                    {t('editor.add')}
                </Button>
            </div>

            <div className="space-y-3">
                {images.map((image, index) => (
                    <div
                        key={`${index}-${image}`}
                        className="space-y-2 rounded-xl border border-border bg-background p-3"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                {t('editor.imageNumber', {
                                    number: index + 1,
                                })}
                            </span>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                onClick={() => handleRemoveImage(index)}
                            >
                                <XMarkIcon
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </Button>
                        </div>
                        <input
                            type="url"
                            name="images[]"
                            value={image}
                            onChange={(event) =>
                                handleUpdateImage(index, event.target.value)
                            }
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    const previewImagesPanel = (
        <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
            <div>
                <p className="text-sm font-medium text-foreground">
                    {t('editor.images')}
                </p>
                <p className="text-xs text-muted-foreground">
                    {safeImages.length
                        ? t('editor.imagesCount', {
                              count: safeImages.length,
                          })
                        : t('editor.noImages')}
                </p>
            </div>

            {safeImages.length ? (
                <div className="grid gap-3">
                    {safeImages.map((image, index) => (
                        <figure
                            key={`${index}-${image}`}
                            className="overflow-hidden rounded-2xl border border-border bg-background"
                        >
                            <img
                                src={image}
                                alt={t('editor.imageAlt', {
                                    title,
                                    number: index + 1,
                                })}
                                className="h-44 w-full object-cover"
                            />
                        </figure>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                    {t('editor.previewImagesEmpty')}
                </div>
            )}
        </div>
    );

    return (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <PhotoIcon
                            className="size-5 text-blue-600"
                            aria-hidden="true"
                        />
                        <h2 className="text-xl font-semibold text-foreground">
                            {title}
                        </h2>
                    </div>
                    {description ? (
                        <p className="max-w-3xl text-sm text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {canEdit ? (
                        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
                            <Button
                                type="button"
                                size="sm"
                                variant={mode === 'write' ? 'default' : 'ghost'}
                                className="rounded-md"
                                onClick={() => setMode('write')}
                            >
                                <PencilSquareIcon
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                {t('editor.write')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={
                                    mode === 'preview' ? 'default' : 'ghost'
                                }
                                className="rounded-md"
                                onClick={() => setMode('preview')}
                            >
                                <EyeIcon
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                {t('editor.preview')}
                            </Button>
                        </div>
                    ) : null}

                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                    >
                        <ClipboardDocumentIcon
                            className="size-4"
                            aria-hidden="true"
                        />
                        {copiedText === (copyText ?? body)
                            ? t('editor.copied')
                            : t('editor.copy')}
                    </Button>
                </div>
            </div>

            {children ? <div className="grid gap-4">{children}</div> : null}

            <div
                className={cn(
                    'grid gap-4',
                    showImagesColumn &&
                        'lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]',
                )}
            >
                {canEdit && mode === 'write' ? (
                    <div className="space-y-3">
                        <label className="block space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">
                                    {resolvedBodyLabel}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {t('editor.words', { count: wordCount })}{' '}
                                    ·{' '}
                                    {t('editor.characters', {
                                        count: body.length,
                                    })}
                                </span>
                            </div>
                            <textarea
                                name={bodyName}
                                value={body}
                                onChange={(event) =>
                                    onBodyChange?.(event.target.value)
                                }
                                className="min-h-[24rem] w-full rounded-2xl border border-border bg-background p-4 text-sm leading-7 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder={t('editor.bodyPlaceholder', {
                                    label: resolvedBodyLabel,
                                })}
                            />
                        </label>
                    </div>
                ) : (
                    <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                        {canEdit ? (
                            <input type="hidden" name={bodyName} value={body} />
                        ) : null}
                        <p className="text-sm font-medium text-foreground">
                            {resolvedBodyLabel}
                        </p>
                        <div className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                            {renderParagraphs(body).length ? (
                                renderParagraphs(body).map(
                                    (paragraph, index) => (
                                        <p
                                            key={`${index}-${paragraph}`}
                                            className={cn(index > 0 && 'mt-4')}
                                        >
                                            {paragraph}
                                        </p>
                                    ),
                                )
                            ) : (
                                <p className="text-muted-foreground">
                                    {t('editor.noContent')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {canManageImages && canEdit && mode !== 'write'
                    ? images.map((image, index) => (
                          <input
                              key={`image-input-${index}`}
                              type="hidden"
                              name="images[]"
                              value={image}
                          />
                      ))
                    : null}
                {showImagesColumn
                    ? canManageImages && mode === 'write'
                        ? editableImagesPanel
                        : previewImagesPanel
                    : null}
            </div>
        </section>
    );
}

export { DocumentFrame };
export default DocumentFrame;
