/**
 * Bridges Inertia form submissions to the toast layer.
 *
 * Returns `onSuccess` / `onError` handlers to drop straight into an Inertia
 * `useForm` submission: success raises the supplied title, failure raises a single
 * toast whose description is the error bag flattened into one readable line.
 * Dashboards use this instead of ad-hoc flash handling so feedback stays uniform.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/feedback/toast';

function stringifyErrors(errors: Record<string, unknown>): string {
    return Object.values(errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value) => Boolean(value))
        .map((value) => String(value))
        .join(' • ');
}

export function useFormToast(successTitle: string, errorTitle?: string) {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const resolvedErrorTitle = errorTitle ?? t('dashboard.formError');

    const onSuccess = useCallback(() => {
        success(successTitle);
    }, [success, successTitle]);

    const onError = useCallback((errors: Record<string, unknown>) => {
        const message = stringifyErrors(errors);
        error(resolvedErrorTitle, message || undefined);
    }, [error, resolvedErrorTitle]);

    return { onSuccess, onError };
}

