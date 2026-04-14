import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
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

interface ToastRecord extends Required<Pick<ToastInput, 'title'>> {
    id: string;
    description?: string;
    variant: ToastVariant;
    state: 'visible' | 'closing';
}

interface ToastContextValue {
    toast: (input: ToastInput) => string;
    success: (title: string, description?: string) => string;
    error: (title: string, description?: string) => string;
    info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_DURATION = 3500;
const EXIT_DURATION = 250;

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

export function ToastProvider({ children }: { children: ReactNode }) {
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
            state: 'visible',
        };

        setToasts((current) => [...current, record]);

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
                                              'pointer-events-auto flex w-full items-start gap-3 rounded-full border px-4 py-3 shadow-lg backdrop-blur transition-all duration-300',
                                              variantStyles[toastItem.variant],
                                              toastItem.state === 'closing'
                                                  ? '-translate-y-4 opacity-0'
                                                  : 'translate-y-0 opacity-100',
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




