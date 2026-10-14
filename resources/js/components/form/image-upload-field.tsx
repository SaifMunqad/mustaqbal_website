import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadImage } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ReactNode, useRef, useState } from 'react';

interface BaseProps {
    label: string;
    hint?: string;
    error?: string;
    className?: string;
}

function FieldShell({
    label,
    hint,
    error,
    className,
    children,
}: BaseProps & { children: ReactNode }) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Label>{label}</Label>
            {children}
            {hint ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
            {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

function useUploader() {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const run = async (file: File) => {
        setUploading(true);
        setUploadError(null);
        try {
            return await uploadImage(file);
        } catch (err) {
            setUploadError(
                err instanceof Error ? err.message : 'Upload failed.',
            );
            return null;
        } finally {
            setUploading(false);
        }
    };

    return { uploading, uploadError, run, setUploadError };
}

interface ImageUploadFieldProps extends BaseProps {
    name: string;
    value: string;
    onChange: (url: string) => void;
    /** File input accept filter. Defaults to images; favicons pass `.ico,image/x-icon`. */
    accept?: string;
    /** Size classes for the previewed image. Defaults to a full-width banner. */
    previewClassName?: string;
    /** Size classes for the empty drop-zone. Defaults to `h-40 w-full`. */
    dropzoneClassName?: string;
}

/**
 * Single-image uploader with live preview. Supports drag & drop, click-to-pick,
 * and a manual URL fallback. Submits the resolved URL through a hidden input so
 * it stays compatible with the existing `url`-validated backend fields.
 */
export function ImageUploadField({
    label,
    name,
    value,
    onChange,
    hint,
    error,
    className,
    accept = 'image/*',
    previewClassName,
    dropzoneClassName,
}: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { uploading, uploadError, run } = useUploader();

    const handleFiles = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        const url = await run(file);
        if (url) onChange(url);
    };

    return (
        <FieldShell
            label={label}
            hint={hint}
            error={error ?? uploadError ?? undefined}
            className={className}
        >
            <input type="hidden" name={name} value={value} />
            {value ? (
                <div
                    className={cn(
                        'relative overflow-hidden rounded-xl border border-border bg-muted/30',
                        previewClassName ? 'w-fit p-2' : '',
                    )}
                >
                    <img
                        src={value}
                        alt={`${label} preview`}
                        className={previewClassName ?? 'h-40 w-full object-cover'}
                    />
                    <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 end-2 size-8 rounded-full"
                        onClick={() => onChange('')}
                        aria-label="Remove image"
                    >
                        <XMarkIcon className="size-4" />
                    </Button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                        event.preventDefault();
                        handleFiles(event.dataTransfer.files);
                    }}
                    className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 text-center text-sm text-muted-foreground transition hover:border-blue-400 hover:bg-muted/40',
                        dropzoneClassName ?? 'h-40 w-full',
                    )}
                >
                    <PhotoIcon className="size-7" />
                    <span>
                        {uploading
                            ? 'Uploading…'
                            : 'Click or drag an image here'}
                    </span>
                    <span className="text-xs">or paste a URL below</span>
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
            />
            <Input
                type="text"
                value={value}
                placeholder="/storage/uploads/image.jpg or https://..."
                onChange={(event) => onChange(event.target.value)}
            />
        </FieldShell>
    );
}

interface GalleryUploadFieldProps extends BaseProps {
    /** Every image renders an input named `${name}[index]` (e.g. images[0]). */
    name: string;
    images: string[];
    onChange: (images: string[]) => void;
    max?: number;
}

/**
 * Multi-image gallery manager with per-image preview, drag & drop upload, and a
 * manual URL fallback. Empty slots are pruned client-side and server-side, so
 * callers can pass back an array that still contains blank entries.
 */
export function GalleryUploadField({
    label,
    name,
    images,
    onChange,
    hint,
    error,
    className,
    max,
}: GalleryUploadFieldProps) {
    const [draft, setDraft] = useState('');
    const { uploading, uploadError, run } = useUploader();

    const addUrl = (url: string) => {
        if (!url.trim()) return;
        if (max && images.filter(Boolean).length >= max) return;
        onChange([...images, url.trim()]);
        setDraft('');
    };

    const removeAt = (index: number) => {
        onChange(images.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files?.length) return;
        const next = [...images];
        for (const file of Array.from(files)) {
            if (max && next.filter(Boolean).length >= max) break;
            const url = await run(file);
            if (url) next.push(url);
        }
        onChange(next);
    };

    return (
        <FieldShell
            label={label}
            hint={hint}
            error={error ?? uploadError ?? undefined}
            className={className}
        >
            <div className="flex flex-wrap gap-3">
                {images.map((image, index) =>
                    image ? (
                        <div
                            key={`${index}-${image}`}
                            className="relative h-24 w-24 overflow-hidden rounded-xl border border-border"
                        >
                            <img
                                src={image}
                                alt={`${label} ${index + 1}`}
                                className="h-full w-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeAt(index)}
                                className="absolute top-1 end-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                                aria-label="Remove image"
                            >
                                <XMarkIcon className="size-3.5" />
                            </button>
                        </div>
                    ) : null,
                )}
                <button
                    type="button"
                    onClick={() =>
                        document.getElementById(`gallery-${name}`)?.click()
                    }
                    disabled={
                        uploading ||
                        (max ? images.filter(Boolean).length >= max : false)
                    }
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground transition hover:border-blue-400 hover:bg-muted/40 disabled:opacity-50"
                >
                    <PhotoIcon className="size-5" />
                    {uploading ? 'Uploading…' : 'Add'}
                </button>
            </div>
            <input
                id={`gallery-${name}`}
                type="file"
                accept="image/*"
                multiple={!max || max > 1}
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
            />
            <div className="flex gap-2">
                <Input
                    type="text"
                    value={draft}
                    placeholder="Paste an image URL or path to add"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            addUrl(draft);
                        }
                    }}
                    className="flex-1"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => addUrl(draft)}
                >
                    Add URL
                </Button>
            </div>
            {images.map((image, index) => (
                <input
                    key={`hidden-${index}`}
                    type="hidden"
                    name={`${name}[${index}]`}
                    value={image}
                />
            ))}
        </FieldShell>
    );
}
