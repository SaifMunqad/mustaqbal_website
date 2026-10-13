import { Quote } from 'lucide-react';
import type { LeadershipMessage } from '@/components/school/about/about-types';

export default function AboutLeadershipMessage({ message }: { message: LeadershipMessage }) {
    const image = message.author_image;
    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-blue-50 shadow-sm dark:border-slate-800 dark:bg-blue-950">
            <div className="flex flex-col items-center gap-6 p-6 md:flex-row md:p-10">
                {image ? (
                    <img
                        src={image}
                        alt={message.author_name ?? ''}
                        className="size-28 shrink-0 rounded-2xl object-cover shadow-md"
                    />
                ) : (
                    <div className="flex size-28 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                        <Quote className="size-10" aria-hidden />
                    </div>
                )}
                <div className="text-center md:text-start">
                    <Quote className="mx-auto mb-2 size-6 text-indigo-400 md:mx-0" aria-hidden />
                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">{message.text}</p>
                    {message.author_name ? (
                        <div className="mt-4 font-semibold text-slate-900 dark:text-white">{message.author_name}</div>
                    ) : null}
                    {message.author_role ? (
                        <div className="text-sm text-slate-500 dark:text-slate-400">{message.author_role}</div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
