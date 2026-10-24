/**
 * Small shared utilities: `cn` merges Tailwind classes (later classes win, and
 * conflicting utilities collapse), while `resolveUrl` / `isSameUrl` normalize
 * Inertia's `href`, which may be either a string or a `{ url }` object returned by
 * Wayfinder's route helpers.
 */
import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}
