interface AboutSectionHeadingProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
}

export default function AboutSectionHeading({
    eyebrow,
    title,
    subtitle,
}: AboutSectionHeadingProps) {
    return (
        <div className="mx-auto max-w-2xl text-center">
            {eyebrow ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-300">
                    <span className="size-1.5 rounded-full bg-indigo-500" />
                    {eyebrow}
                </div>
            ) : null}
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">
                {title}
            </h2>
            {subtitle ? (
                <p className="mt-2 text-sm text-slate-600 md:text-base dark:text-slate-300">
                    {subtitle}
                </p>
            ) : null}
        </div>
    );
}
