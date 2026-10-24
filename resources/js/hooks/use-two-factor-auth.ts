/**
 * Data access for the two-factor settings page: QR code, secret key, recovery
 * codes, and the enable/confirm/disable calls.
 *
 * Requests go to the Fortify endpoints over `fetch` with a JSON `Accept` header,
 * and failures are surfaced as translated error messages rather than thrown.
 * `OTP_MAX_LENGTH` is exported so the code input and the validation agree.
 */
import i18n from '@/i18n';
import { qrCode, recoveryCodes, secretKey } from '@/routes/two-factor';
import { useCallback, useMemo, useState } from 'react';

interface TwoFactorSetupData {
    svg: string;
    url: string;
}

interface TwoFactorSecretKey {
    secretKey: string;
}

export const OTP_MAX_LENGTH = 6;

const fetchJson = async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
    }

    return response.json();
};

export const useTwoFactorAuth = () => {
    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const hasSetupData = useMemo<boolean>(
        () => qrCodeSvg !== null && manualSetupKey !== null,
        [qrCodeSvg, manualSetupKey],
    );

    const fetchQrCode = useCallback(async (): Promise<void> => {
        try {
            const { svg } = await fetchJson<TwoFactorSetupData>(qrCode.url());
            setQrCodeSvg(svg);
        } catch {
            setErrors((prev) => [
                ...prev,
                i18n.t('settings.twoFactor.errors.qrCode'),
            ]);
            setQrCodeSvg(null);
        }
    }, []);

    const fetchSetupKey = useCallback(async (): Promise<void> => {
        try {
            const { secretKey: key } = await fetchJson<TwoFactorSecretKey>(
                secretKey.url(),
            );
            setManualSetupKey(key);
        } catch {
            setErrors((prev) => [
                ...prev,
                i18n.t('settings.twoFactor.errors.setupKey'),
            ]);
            setManualSetupKey(null);
        }
    }, []);

    const clearErrors = useCallback((): void => {
        setErrors([]);
    }, []);

    const clearSetupData = useCallback((): void => {
        setManualSetupKey(null);
        setQrCodeSvg(null);
        clearErrors();
    }, [clearErrors]);

    const fetchRecoveryCodes = useCallback(async (): Promise<void> => {
        try {
            clearErrors();
            const codes = await fetchJson<string[]>(recoveryCodes.url());
            setRecoveryCodesList(codes);
        } catch {
            setErrors((prev) => [
                ...prev,
                i18n.t('settings.twoFactor.errors.recoveryCodes'),
            ]);
            setRecoveryCodesList([]);
        }
    }, [clearErrors]);

    const fetchSetupData = useCallback(async (): Promise<void> => {
        try {
            clearErrors();
            await Promise.all([fetchQrCode(), fetchSetupKey()]);
        } catch {
            setQrCodeSvg(null);
            setManualSetupKey(null);
        }
    }, [clearErrors, fetchQrCode, fetchSetupKey]);

    return {
        qrCodeSvg,
        manualSetupKey,
        recoveryCodesList,
        hasSetupData,
        errors,
        clearErrors,
        clearSetupData,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
    };
};
