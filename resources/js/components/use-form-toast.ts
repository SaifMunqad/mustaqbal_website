import { useCallback } from 'react';
import { useToast } from '@/components/toast';

function stringifyErrors(errors: Record<string, unknown>): string {
    return Object.values(errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value) => Boolean(value))
        .map((value) => String(value))
        .join(' • ');
}

export function useFormToast(successTitle: string, errorTitle = 'Please fix the highlighted fields.') {
    const { success, error } = useToast();

    const onSuccess = useCallback(() => {
        success(successTitle);
    }, [success, successTitle]);

    const onError = useCallback((errors: Record<string, unknown>) => {
        const message = stringifyErrors(errors);
        error(errorTitle, message || undefined);
    }, [error, errorTitle]);

    return { onSuccess, onError };
}

