import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import i18n from '@/i18n';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastInput {
    title: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
}

/**
 * A server-flashed notification, normalized by the Inertia middleware. The id is
 * generated once per flash so the client can guarantee it is shown exactly once.
 */
export interface FlashNotification {
    id: string;
    variant: ToastVariant;
    title: string;
    description?: string | null;
}

export interface FlashProps {
    notification?: FlashNotification | null;
}

// Browser-cached record of notification ids already shown, so reloads and
// re-renders never replay a toast. Kept small and rolling.
const SEEN_KEY = 'mustaqbal.toast.seen';
const MAX_SEEN = 50;

const readSeenIds = (): string[] => {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const parsed = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]');

        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
        return [];
    }
};

const rememberSeenId = (id: string): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const next = [...readSeenIds().filter((seen) => seen !== id), id].slice(-MAX_SEEN);
        window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {
        // Ignore storage failures (private mode / quota); the toast still shows.
    }
};

// The backend may send either a plain message or an i18n key; translate when a
// matching key exists, otherwise show the string verbatim.
const resolveText = (text: string): string => (i18n.exists(text) ? String(i18n.t(text)) : text);

interface ToastRecord extends Required<Pick<ToastInput, 'title'>> {
    id: string;
    description?: string;
    variant: ToastVariant;
    state: 'entering' | 'visible' | 'closing';
}

interface ToastContextValue {
    toast: (input: ToastInput) => string;
    success: (title: string, description?: string) => string;
    error: (title: string, description?: string) => string;
    info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_DURATION = 3500;
const EXIT_DURATION = 300;

const variantStyles: Record<ToastVariant, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-50',
    error: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-50',
    info: 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-50',
};

const iconByVariant: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
    success: CheckCircle2,
    error: CircleAlert,
    info: Info,
};

export function ToastProvider({
    children,
    initialFlash,
}: {
    children: ReactNode;
    initialFlash?: FlashProps | null;
}) {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);
    const timers = useRef(new Map<string, number>());

    const dismiss = useCallback((id: string) => {
        setToasts((current) =>
            current.map((toast) =>
                toast.id === id ? { ...toast, state: 'closing' } : toast,
            ),
        );

        const timer = window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
            timers.current.delete(id);
        }, EXIT_DURATION);

        timers.current.set(id, timer);
    }, []);

    const toast = useCallback((input: ToastInput) => {
        const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
        const record: ToastRecord = {
            id,
            title: input.title,
            description: input.description,
            variant: input.variant ?? 'info',
            state: 'entering',
        };

        setToasts((current) => [...current, record]);

        // Mount off-screen above, then slide down into view on the next paint.
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                setToasts((current) =>
                    current.map((toastItem) =>
                        toastItem.id === id && toastItem.state === 'entering'
                            ? { ...toastItem, state: 'visible' }
                            : toastItem,
                    ),
                );
            }),
        );

        const timer = window.setTimeout(() => dismiss(id), input.duration ?? DEFAULT_DURATION);
        timers.current.set(id, timer);

        return id;
    }, [dismiss]);

    const api = useMemo<ToastContextValue>(() => ({
        toast,
        success: (title, description) => toast({ title, description, variant: 'success' }),
        error: (title, description) => toast({ title, description, variant: 'error' }),
        info: (title, description) => toast({ title, description, variant: 'info' }),
    }), [toast]);

    const showNotification = useCallback(
        (notification?: FlashNotification | null) => {
            if (! notification?.id || typeof window === 'undefined') {
                return;
            }

            if (readSeenIds().includes(notification.id)) {
                return;
            }

            rememberSeenId(notification.id);

            toast({
                title: resolveText(notification.title),
                description: notification.description ? resolveText(notification.description) : undefined,
                variant: notification.variant,
            });
        },
        [toast],
    );

    // Consume flashed notifications globally: the initial page load plus every
    // subsequent Inertia navigation. Living here means layouts need no wiring.
    useEffect(() => {
        let cancelled = false;

        const handle = (notification?: FlashNotification | null) => {
            if (! cancelled) {
                showNotification(notification);
            }
        };

        // Defer the initial flash one tick so we never set state synchronously
        // inside the effect body.
        const initialTimer = window.setTimeout(() => handle(initialFlash?.notification), 0);

        const removeListener = router.on('navigate', (event) => {
            const flash = (event.detail.page.props as { flash?: FlashProps | null }).flash;
            handle(flash?.notification);
        });

        return () => {
            cancelled = true;
            window.clearTimeout(initialTimer);
            removeListener();
        };
    }, [showNotification, initialFlash]);

    useEffect(() => {
        return () => {
            timers.current.forEach((timer) => window.clearTimeout(timer));
            timers.current.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {typeof document !== 'undefined'
                ? createPortal(
                      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
                          <div className="flex w-full max-w-xl flex-col items-center gap-2">
                              {toasts.map((toastItem) => {
                                  const Icon = iconByVariant[toastItem.variant];

                                  return (
                                      <div
                                          key={toastItem.id}
                                          className={cn(
                                              'pointer-events-auto flex w-full items-start gap-3 rounded-full border px-4 py-3 shadow-lg backdrop-blur transition-transform duration-300 ease-out',
                                              variantStyles[toastItem.variant],
                                              toastItem.state === 'visible'
                                                  ? 'translate-y-0'
                                                  : '-translate-y-[200%]',
                                          )}
                                      >
                                          <Icon className="mt-0.5 size-5 shrink-0" />
                                          <div className="min-w-0 flex-1">
                                              <p className="text-sm font-semibold leading-tight">
                                                  {toastItem.title}
                                              </p>
                                              {toastItem.description ? (
                                                  <p className="mt-0.5 text-sm leading-snug opacity-90">
                                                      {toastItem.description}
                                                  </p>
                                              ) : null}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>,
                      document.body,
                  )
                : null}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider.');
    }

    return context;
}




