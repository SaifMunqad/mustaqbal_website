/**
 * Upload an image to the dashboard upload endpoint and resolve its public URL.
 *
 * The `XSRF-TOKEN` cookie Laravel sets for SPAs is encrypted, so its raw value
 * is sent back in the `X-XSRF-TOKEN` header, which Laravel decrypts before
 * comparing it to the session token. This mirrors how Inertia's own axios
 * requests authenticate and avoids a "CSRF token mismatch" error.
 */
function getCsrfToken(): string {
    const match = document.cookie.match(/(^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : '';
}

export async function uploadImage(file: File): Promise<string> {
    const result = await uploadImageDetailed(file);
    return result.url;
}

export interface ImageUploadResult {
    url: string;
    path: string;
}

/**
 * Upload an image and resolve both its public URL (for preview) and its
 * disk-relative path (for storage). Used when a book's image can be replaced
 * with any uploaded picture, keeping the path alongside the auto-generated
 * PDF thumbnail.
 */
export async function uploadImageDetailed(file: File): Promise<ImageUploadResult> {
    const body = new FormData();
    body.append('image', file);

    const response = await fetch('/dashboard/upload', {
        method: 'POST',
        body,
        headers: {
            Accept: 'application/json',
            'X-XSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error(await readUploadError(response));
    }

    const data = (await response.json()) as ImageUploadResult;
    if (!data.url || !data.path) {
        throw new Error('Upload succeeded but no image was returned.');
    }

    return data;
}

async function readUploadError(response: Response): Promise<string> {
    let message = 'Upload failed.';
    try {
        const data = await response.json();
        const firstError = data?.errors
            ? (Object.values(data.errors).flat()[0] as string | undefined)
            : undefined;
        message = firstError ?? data?.message ?? message;
    } catch {
        // Ignore JSON parse errors and fall back to the generic message.
    }
    return message;
}

export interface PdfUploadResult {
    path: string;
    url: string;
    thumbnail_path: string | null;
    thumbnail_url: string | null;
}

/**
 * Upload a book PDF. The server stores it and renders the first page into a
 * thumbnail, returning both disk paths (to submit as hidden fields) and their
 * public URLs (for previewing).
 */
export async function uploadPdf(file: File): Promise<PdfUploadResult> {
    const body = new FormData();
    body.append('file', file);

    const response = await fetch('/dashboard/upload-pdf', {
        method: 'POST',
        body,
        headers: {
            Accept: 'application/json',
            'X-XSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        let message = 'Upload failed.';
        try {
            const data = await response.json();
            const firstError = data?.errors
                ? (Object.values(data.errors).flat()[0] as string | undefined)
                : undefined;
            message = firstError ?? data?.message ?? message;
        } catch {
            // Ignore JSON parse errors and fall back to the generic message.
        }
        throw new Error(message);
    }

    const data = (await response.json()) as PdfUploadResult;
    if (!data.path) {
        throw new Error('Upload succeeded but no file path was returned.');
    }

    return data;
}
