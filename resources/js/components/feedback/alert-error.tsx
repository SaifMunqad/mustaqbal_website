/**
 * Destructive alert listing one or more error messages.
 *
 * Messages are de-duplicated before rendering because validation can report the
 * same message for several fields. A translated default title is used when none
 * is supplied. Used by the two-factor setup modal and recovery-code panel.
 */
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AlertError({
    errors,
    title,
}: {
    errors: string[];
    title?: string;
}) {
    const { t } = useTranslation();

    return (
        <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>
                {title || t('settings.twoFactor.errorTitle')}
            </AlertTitle>
            <AlertDescription>
                <ul className="list-inside list-disc text-sm">
                    {Array.from(new Set(errors)).map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
}
