/**
 * Upload an image to the dashboard upload endpoint and resolve its public URL.
 *
 * Uses the plaintext `XSRF-TOKEN` cookie Laravel sets for SPA requests, so it
 * works with a plain `fetch` call outside of Inertia's form helpers.
 */
function getCsrfToken(): string {
    const match = document.cookie.match(/(^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : '';
}

export async function uploadImage(file: File): Promise<string> {
    const body = new FormData();
    body.append('image', file);

    const response = await fetch('/dashboard/upload', {
        method: 'POST',
        body,
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
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

    const data = (await response.json()) as { url?: string };
    if (!data.url) {
        throw new Error('Upload succeeded but no URL was returned.');
    }

    return data.url;
}
