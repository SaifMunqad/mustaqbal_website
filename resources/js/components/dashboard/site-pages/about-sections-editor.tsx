import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VALUE_ICONS } from '@/components/school/about/about-constants';
import type { AboutContent } from '@/components/school/about/about-types';

const ICON_KEYS = Object.keys(VALUE_ICONS);

export type AboutSectionKey =
    | 'intro'
    | 'mission'
    | 'vision'
    | 'stats'
    | 'values'
    | 'highlights'
    | 'goals'
    | 'main_points'
    | 'message'
    | 'faq';

interface AboutSectionsEditorProps {
    value: AboutContent;
    onChange: (next: AboutContent) => void;
    dir?: 'ltr' | 'rtl';
    /** Render only these sections (used by the visual editor's per-block sheets). */
    only?: AboutSectionKey[];
}

/**
 * Structured-section editor for the About page. Fully controlled: it owns no
 * language state itself — the parent renders one instance for the currently
 * editing language, so the whole page's sections stage in a single submit.
 * Pass `only` to render a subset (one block at a time in the visual editor).
 */
export default function AboutSectionsEditor({
    value,
    onChange,
    dir = 'ltr',
    only,
}: AboutSectionsEditorProps) {
    const set = (patch: Partial<AboutContent>) => onChange({ ...value, ...patch });

    const removeAt = (key: keyof AboutContent, rows: unknown[], index: number) =>
        set({ [key]: rows.filter((_, i) => i !== index) } as Partial<AboutContent>);

    const show = (key: AboutSectionKey) => !only || only.includes(key);

    const stats = value.stats ?? [];
    const values = value.values ?? [];
    const highlights = value.highlights ?? [];
    const faq = value.faq ?? [];
    const goals = value.goals ?? [];
    const mainPoints = value.main_points ?? [];
    const message = value.message ?? {};

    return (
        <div className="space-y-6" dir={dir}>
            {show('intro') ? (
                <div className="grid gap-2">
                    <Label htmlFor="intro">Intro (hero subtitle)</Label>
                    <Textarea
                        id="intro"
                        rows={2}
                        dir={dir}
                        value={value.intro ?? ''}
                        onChange={(event) => set({ intro: event.target.value })}
                    />
                </div>
            ) : null}

            {show('mission') || show('vision') ? (
                <div className="grid gap-2 sm:grid-cols-2">
                    {show('mission') ? (
                        <div className="grid gap-2">
                            <Label htmlFor="mission">Mission</Label>
                            <Textarea
                                id="mission"
                                rows={3}
                                dir={dir}
                                value={value.mission ?? ''}
                                onChange={(event) => set({ mission: event.target.value })}
                            />
                        </div>
                    ) : null}
                    {show('vision') ? (
                        <div className="grid gap-2">
                            <Label htmlFor="vision">Vision</Label>
                            <Textarea
                                id="vision"
                                rows={3}
                                dir={dir}
                                value={value.vision ?? ''}
                                onChange={(event) => set({ vision: event.target.value })}
                            />
                        </div>
                    ) : null}
                </div>
            ) : null}

            {show('stats') ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Stats</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => set({ stats: [...stats, { value: '', label: '' }] })}>
                            Add stat
                        </Button>
                    </div>
                    {stats.map((stat, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                className="w-28"
                                placeholder="1,200+"
                                value={stat.value}
                                onChange={(event) => set({ stats: stats.map((s, i) => (i === index ? { ...s, value: event.target.value } : s)) })}
                            />
                            <Input
                                className="flex-1"
                                placeholder="Students"
                                value={stat.label}
                                onChange={(event) => set({ stats: stats.map((s, i) => (i === index ? { ...s, label: event.target.value } : s)) })}
                            />
                            <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => removeAt('stats', stats, index)}>
                                ✕
                            </Button>
                        </div>
                    ))}
                </div>
            ) : null}

            {show('values') ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Values</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => set({ values: [...values, { icon: ICON_KEYS[0], title: '', text: '' }] })}>
                            Add value
                        </Button>
                    </div>
                    {values.map((item, index) => (
                        <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                            <div className="flex items-center gap-2">
                                <select
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                    value={item.icon ?? ICON_KEYS[0]}
                                    onChange={(event) => set({ values: values.map((v, i) => (i === index ? { ...v, icon: event.target.value } : v)) })}
                                >
                                    {ICON_KEYS.map((icon) => (
                                        <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                </select>
                                <Input
                                    className="flex-1"
                                    placeholder="Title"
                                    value={item.title}
                                    onChange={(event) => set({ values: values.map((v, i) => (i === index ? { ...v, title: event.target.value } : v)) })}
                                />
                                <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => removeAt('values', values, index)}>
                                    ✕
                                </Button>
                            </div>
                            <Textarea
                                rows={2}
                                dir={dir}
                                placeholder="Description"
                                value={item.text ?? ''}
                                onChange={(event) => set({ values: values.map((v, i) => (i === index ? { ...v, text: event.target.value } : v)) })}
                            />
                        </div>
                    ))}
                </div>
            ) : null}

            {show('highlights') ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Highlights</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => set({ highlights: [...highlights, { title: '', text: '' }] })}>
                            Add highlight
                        </Button>
                    </div>
                    {highlights.map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <Input
                                className="w-48"
                                placeholder="Title"
                                value={item.title}
                                onChange={(event) => set({ highlights: highlights.map((h, i) => (i === index ? { ...h, title: event.target.value } : h)) })}
                            />
                            <Textarea
                                className="flex-1"
                                rows={2}
                                dir={dir}
                                placeholder="Text"
                                value={item.text ?? ''}
                                onChange={(event) => set({ highlights: highlights.map((h, i) => (i === index ? { ...h, text: event.target.value } : h)) })}
                            />
                            <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => removeAt('highlights', highlights, index)}>
                                ✕
                            </Button>
                        </div>
                    ))}
                </div>
            ) : null}

            {show('goals') ? (
                <SimpleListEditor
                    label="Goals"
                    items={goals}
                    placeholder="A goal"
                    onChange={(items) => set({ goals: items })}
                />
            ) : null}

            {show('main_points') ? (
                <SimpleListEditor
                    label="Main points"
                    items={mainPoints}
                    placeholder="A key point"
                    onChange={(items) => set({ main_points: items })}
                />
            ) : null}

            {show('message') ? (
                <div className="space-y-2 rounded-lg border border-border p-3">
                    <Label>Leadership message</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                            placeholder="Author name"
                            value={message.author_name ?? ''}
                            onChange={(event) => set({ message: { ...message, author_name: event.target.value } })}
                        />
                        <Input
                            placeholder="Author role"
                            value={message.author_role ?? ''}
                            onChange={(event) => set({ message: { ...message, author_role: event.target.value } })}
                        />
                    </div>
                    <Input
                        placeholder="Author image URL (/storage/… or https://…)"
                        value={message.author_image ?? ''}
                        onChange={(event) => set({ message: { ...message, author_image: event.target.value } })}
                    />
                    <Textarea
                        rows={3}
                        dir={dir}
                        placeholder="Message text"
                        value={message.text ?? ''}
                        onChange={(event) => set({ message: { ...message, text: event.target.value } })}
                    />
                </div>
            ) : null}

            {show('faq') ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>FAQ</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => set({ faq: [...faq, { question: '', answer: '' }] })}>
                            Add FAQ
                        </Button>
                    </div>
                    {faq.map((item, index) => (
                        <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    className="flex-1"
                                    placeholder="Question"
                                    value={item.question ?? ''}
                                    onChange={(event) => set({ faq: faq.map((f, i) => (i === index ? { ...f, question: event.target.value } : f)) })}
                                />
                                <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => removeAt('faq', faq, index)}>
                                    ✕
                                </Button>
                            </div>
                            <Textarea
                                rows={2}
                                dir={dir}
                                placeholder="Answer"
                                value={item.answer ?? ''}
                                onChange={(event) => set({ faq: faq.map((f, i) => (i === index ? { ...f, answer: event.target.value } : f)) })}
                            />
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function SimpleListEditor({
    label,
    items,
    placeholder,
    onChange,
}: {
    label: string;
    items: string[];
    placeholder: string;
    onChange: (items: string[]) => void;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, ''])}>
                    Add
                </Button>
            </div>
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input
                        className="flex-1"
                        placeholder={placeholder}
                        value={item}
                        onChange={(event) => onChange(items.map((v, i) => (i === index ? event.target.value : v)))}
                    />
                    <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                        ✕
                    </Button>
                </div>
            ))}
        </div>
    );
}
