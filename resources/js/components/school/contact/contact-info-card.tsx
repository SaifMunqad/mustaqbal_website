import type { ReactNode } from 'react';

interface ContactInfoCardProps {
    icon: ReactNode;
    label: string;
    value: string;
    href?: string;
    accent: string;
}

/**
 * A single icon-led info tile in the "get in touch" column. Renders as an
 * anchor (click-to-call / click-to-email / WhatsApp) when `href` is provided,
 * or a static block otherwise.
 */
export default function ContactInfoCard({
    icon,
    label,
    value,
    href,
    accent,
}: ContactInfoCardProps) {
    const body = (
        <div className="flex items-start gap-3.5 rounded-2xl border border-brand-border bg-brand-soft p-4 shadow-sm transition hover:shadow-md">
            <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    {label}
                </p>
                <p
                    dir="auto"
                    className="mt-0.5 text-sm font-medium break-words text-slate-800 dark:text-slate-100"
                >
                    {value}
                </p>
            </div>
        </div>
    );

    if (!href) {
        return body;
    }

    return (
        <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="block"
        >
            {body}
        </a>
    );
}
