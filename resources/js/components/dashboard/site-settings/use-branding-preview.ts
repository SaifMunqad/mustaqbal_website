import type { BrandPalette, TintDepth } from '@/types';
import { useEffect, useState } from 'react';

/**
 * The `XSRF-TOKEN` cookie Laravel sets for SPAs is encrypted, so its raw value is
 * sent back in `X-XSRF-TOKEN` and decrypted server-side. Same approach as the
 * upload helper, which is why this is repeated rather than shared.
 */
function csrfToken(): string {
    const match = document.cookie.match(/(^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[2]) : '';
}

export interface PaletteInput {
    brand_color: string;
    accent_color: string;
    tint_depth: TintDepth;
}

/**
 * Asks the backend to derive a palette for the colors currently being edited.
 *
 * The OKLab mixing and the contrast clamping live in PHP (BrandPalette), so the
 * preview can never disagree with what the public site will render. Requests are
 * debounced and the previous (last good) palette is kept on failure.
 */
export function useBrandingPreview(
    input: PaletteInput,
    initial: BrandPalette | null,
): BrandPalette | null {
    const [palette, setPalette] = useState<BrandPalette | null>(initial);
    const { brand_color, accent_color, tint_depth } = input;

    useEffect(() => {
        const controller = new AbortController();

        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(
                    '/dashboard/site-settings/palette',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-XSRF-TOKEN': csrfToken(),
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            brand_color: brand_color || null,
                            accent_color: accent_color || null,
                            tint_depth,
                        }),
                        signal: controller.signal,
                    },
                );

                // Invalid input (e.g. a half-typed hex): keep the last good one.
                if (!response.ok) {
                    return;
                }

                setPalette((await response.json()) as BrandPalette);
            } catch {
                // Aborted or offline: keep the last good palette on screen.
            }
        }, 250);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [brand_color, accent_color, tint_depth]);

    return palette;
}
