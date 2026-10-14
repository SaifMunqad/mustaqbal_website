import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadImageDetailed, uploadPdf } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { ArrowUpTrayIcon, DocumentTextIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

interface BookMediaFieldProps {
    label: string;
    /** Hidden inputs are named exactly these so the backend reads the paths. */
    filePathName: string;
    thumbnailPathName: string;
    filePath: string;
    thumbnailPath: string | null;
    /** Current image URL for preview (existing book). */
    thumbnailUrl?: string | null;
    /** Current PDF URL (existing book). */
    fileUrl?: string | null;
    onChange: (result: { file_path: string; thumbnail_path: string | null }) => void;
    error?: string;
    className?: string;
}

/**
 * Book media manager.
 *
 * - Uploading a PDF stores it and renders its first page as the book image.
 * - Uploading any image overrides that image (the PDF is left untouched).
 *
 * The resolved disk paths are submitted through hidden inputs so saving the
 * book stays a plain (non-multipart) request, mirroring the image uploader.
 */
export function BookMediaField({
    label,
    filePathName,
    thumbnailPathName,
    filePath,
    thumbnailPath,
    thumbnailUrl,
    fileUrl,
    onChange,
    error,
    className,
}: BookMediaFieldProps) {
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState<null | 'pdf' | 'image'>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(thumbnailUrl ?? null);

    const handlePdf = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;

        setBusy('pdf');
        setUploadError(null);
        try {
            const result = await uploadPdf(file);
            setPreview(result.thumbnail_url);
            onChange({ file_path: result.path, thumbnail_path: result.thumbnail_path });
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed.');
        } finally {
            setBusy(null);
        }
    };

    const handleImage = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;

        setBusy('image');
        setUploadError(null);
        try {
            const result = await uploadImageDetailed(file);
            setPreview(result.url);
            // Keep the existing PDF path; only replace the image.
            onChange({ file_path: filePath, thumbnail_path: result.path });
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed.');
        } finally {
            setBusy(null);
        }
    };

    const clear = () => {
        setPreview(null);
        onChange({ file_path: '', thumbnail_path: null });
        if (pdfInputRef.current) pdfInputRef.current.value = '';
    };

    const currentUrl = fileUrl ?? (filePath ? `/storage/${filePath}` : null);

    return (
        <div className={cn('grid gap-2', className)}>
            <Label>{label}</Label>

            <input type="hidden" name={filePathName} value={filePath} />
            <input type="hidden" name={thumbnailPathName} value={thumbnailPath ?? ''} />

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    {preview ? (
                        <img src={preview} alt="Book cover" className="h-28 w-20 rounded-lg border border-border object-cover" />
                    ) : (
                        <div className="flex h-28 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-background text-muted-foreground">
                            <PhotoIcon className="size-6" />
                        </div>
                    )}
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">{busy ? 'Uploading…' : preview ? 'Image set' : 'No image yet'}</p>
                        <p>Upload a PDF and its first page becomes the cover.</p>
                        <p>You can replace that image with any picture.</p>
                        {currentUrl ? (
                            <a href={currentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 underline">
                                <DocumentTextIcon className="size-3.5" />
                                View PDF
                            </a>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:ms-auto">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => pdfInputRef.current?.click()}
                        disabled={busy !== null}
                    >
                        <ArrowUpTrayIcon className="size-4" />
                        Upload PDF
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={busy !== null}
                    >
                        <PhotoIcon className="size-4" />
                        {preview ? 'Change image' : 'Upload image'}
                    </Button>
                    {preview || filePath ? (
                        <Button type="button" variant="ghost" size="sm" onClick={clear} aria-label="Remove file and image">
                            <XMarkIcon className="size-4" />
                            Remove
                        </Button>
                    ) : null}
                </div>
            </div>

            <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => {
                    handlePdf(event.target.files);
                    event.target.value = '';
                }}
            />
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    handleImage(event.target.files);
                    event.target.value = '';
                }}
            />

            {error || uploadError ? <p className="text-sm text-red-600 dark:text-red-400">{error ?? uploadError}</p> : null}
        </div>
    );
}
