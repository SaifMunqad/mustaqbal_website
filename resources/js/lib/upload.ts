/**
 * Upload an image to the dashboard upload endpoint and resolve its public URL.
 *
 * The `XSRF-TOKEN` cookie Laravel sets for SPAs is encrypted, so its raw value
 * is sent back in the `X-XSRF-TOKEN` header, which Laravel decrypts before
 * comparing it to the session token. This mirrors how Inertia's own axios
 * requests authenticate and avoids a "CSRF token mismatch" error.
 */
import i18n from '@/i18n';

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
 * Confirm a freshly returned image URL is actually reachable from the browser.
 * The file can sit on the disk yet be un-openable when the `public/storage`
 * symlink is not served, so we load it as an image (with a cache-busting probe
 * parameter) and only treat the upload as successful once it decodes.
 */
function probeRoutable(url: string, timeoutMs = 15000): Promise<boolean> {
    return new Promise((resolve) => {
        const image = new Image();
        let settled = false;

        const finish = (ok: boolean) => {
            if (settled) return;
            settled = true;
            image.onload = null;
            image.onerror = null;
            window.clearTimeout(timer);
            resolve(ok);
        };

        const timer = window.setTimeout(() => finish(false), timeoutMs);
        image.onload = () => finish(true);
        image.onerror = () => finish(false);

        const separator = url.includes('?') ? '&' : '?';
        image.src = `${url}${separator}probe=${Date.now()}`;
    });
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
        throw new Error(i18n.t('media.uploadNoImage'));
    }

    // Re-check: the stored image must actually open at its public URL before we
    // hand it back, otherwise the form would persist a link that renders broken.
    if (!(await probeRoutable(data.url))) {
        throw new Error(i18n.t('media.notRoutable'));
    }

    return data;
}

async function readUploadError(response: Response): Promise<string> {
    let message = i18n.t('media.uploadFailed');
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
        let message = i18n.t('media.uploadFailed');
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
        throw new Error(i18n.t('media.uploadNoFile'));
    }

    return data;
}
