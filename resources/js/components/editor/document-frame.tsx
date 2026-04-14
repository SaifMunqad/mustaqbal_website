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
    bodyLabel = 'Body',
    copyText,
    children,
}: DocumentFrameProps) {
    const [mode, setMode] = useState<'write' | 'preview'>('write');
    const [copiedText, copy] = useClipboard();
    const canEdit = typeof onBodyChange === 'function' && typeof onImagesChange === 'function';
    const safeImages = useMemo(() => images.filter((image) => image.trim().length > 0), [images]);

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

        const nextImages = images.filter((_, currentIndex) => currentIndex !== index);
        onImagesChange(nextImages.length ? nextImages : ['']);
    };

    const handleCopy = async () => {
        await copy(copyText ?? body);
    };

    return (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <PhotoIcon className="size-5 text-blue-600" aria-hidden="true" />
                        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
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
                                <PencilSquareIcon className="size-4" aria-hidden="true" />
                                Write
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={mode === 'preview' ? 'default' : 'ghost'}
                                className="rounded-md"
                                onClick={() => setMode('preview')}
                            >
                                <EyeIcon className="size-4" aria-hidden="true" />
                                Preview
                            </Button>
                        </div>
                    ) : null}

                    <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
                        <ClipboardDocumentIcon className="size-4" aria-hidden="true" />
                        {copiedText === (copyText ?? body) ? 'Copied' : 'Copy'}
                    </Button>
                </div>
            </div>

            {children ? <div className="grid gap-4">{children}</div> : null}

            {canEdit && mode === 'write' ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
                    <div className="space-y-3">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-foreground">{bodyLabel}</span>
                            <textarea
                                name={bodyName}
                                value={body}
                                onChange={(event) => onBodyChange?.(event.target.value)}
                                className="min-h-[24rem] w-full rounded-2xl border border-border bg-background p-4 text-sm leading-7 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder={`Write the ${bodyLabel.toLowerCase()} here...`}
                            />
                        </label>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-foreground">Images</p>
                                <p className="text-xs text-muted-foreground">
                                    Add one or more image URLs.
                                </p>
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={handleAddImage}>
                                <PlusIcon className="size-4" aria-hidden="true" />
                                Add
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {images.map((image, index) => (
                                <div key={`${index}-${image}`} className="space-y-2 rounded-xl border border-border bg-background p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            Image #{index + 1}
                                        </span>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-8"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            <XMarkIcon className="size-4" aria-hidden="true" />
                                        </Button>
                                    </div>
                                    <input
                                        type="url"
                                        name="images[]"
                                        value={image}
                                        onChange={(event) => handleUpdateImage(index, event.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
                    {canEdit ? <input type="hidden" name={bodyName} value={body} /> : null}
                    {canEdit
                        ? images.map((image, index) => (
                              <input key={`preview-image-${index}`} type="hidden" name="images[]" value={image} />
                          ))
                        : null}
                    <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                        <p className="text-sm font-medium text-foreground">{bodyLabel}</p>
                        <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                            {renderParagraphs(body).length ? (
                                renderParagraphs(body).map((paragraph, index) => (
                                    <p key={`${index}-${paragraph}`} className={cn(index > 0 && 'mt-4')}>
                                        {paragraph}
                                    </p>
                                ))
                            ) : (
                                <p className="text-muted-foreground">No content available.</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                        <div>
                            <p className="text-sm font-medium text-foreground">Images</p>
                            <p className="text-xs text-muted-foreground">
                                {safeImages.length ? `${safeImages.length} image(s)` : 'No images attached.'}
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
                                            alt={`${title} image ${index + 1}`}
                                            className="h-44 w-full object-cover"
                                        />
                                    </figure>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                                The preview will show attached images here.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export { DocumentFrame };
export default DocumentFrame;




