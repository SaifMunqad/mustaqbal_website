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

