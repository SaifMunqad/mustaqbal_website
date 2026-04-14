import { useToast } from '@/components/toast';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import type { ToastInput } from '@/components/toast';

export function FlashToastBridge() {
    const { props } = usePage<{ flash?: { toast?: ToastInput | null } }>();
    const { toast } = useToast();
    const lastToast = useRef<string>('');

    useEffect(() => {
        const flashToast = props.flash?.toast;
        if (!flashToast) {
            return;
        }

        const signature = JSON.stringify(flashToast);
        if (signature === lastToast.current) {
            return;
        }

        lastToast.current = signature;
        toast(flashToast);
    }, [props.flash, toast]);

    return null;
}

