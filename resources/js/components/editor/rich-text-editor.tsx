import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import mammoth from 'mammoth';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    DocumentIcon,
    PhotoIcon,
    TableCellsIcon,
} from '@heroicons/react/24/outline';
import Chart from '@/components/editor/extensions/chart';
import EditorChartPanel from '@/components/editor/editor-chart-panel';
import Toolbar, { ToolButton } from '@/components/editor/editor-toolbar';
import { dataUriToFile, type ChartDraft } from '@/components/editor/editor-utils';
import { uploadImage } from '@/lib/upload';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    /** Form field name; a hidden input with this name carries the HTML value. */
    name: string;
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    /** Writing direction for the editable area, from the article's language. */
    dir?: 'rtl' | 'ltr';
    className?: string;
}

export default function RichTextEditor({
    name,
    value,
    onChange,
    placeholder = 'Write your article here, or import a Word document / paste from Word...',
    dir = 'ltr',
    className,
}: RichTextEditorProps) {
    const [mounted, setMounted] = useState(false);
    const [chartOpen, setChartOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [chart, setChart] = useState<ChartDraft>({
        type: 'bar',
        title: '',
        labels: '',
        values: '',
    });

    const imageInputRef = useRef<HTMLInputElement>(null);
    const docxInputRef = useRef<HTMLInputElement>(null);

    // Tiptap/ProseMirror needs the DOM; only build the editor on the client.
    useEffect(() => {
        setMounted(true);
    }, []);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                // Use our own Underline extension so toggleUnderline is always
                // available without clashing with StarterKit's bundled copy.
                underline: false,
                link: {
                    openOnClick: false,
                    autolink: true,
                    HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
                },
            }),
            Underline,
            Image.configure({ inline: false, allowBase64: false }),
            Placeholder.configure({ placeholder }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Chart,
        ],
        content: value || '',
        onUpdate: ({ editor: instance }) => {
            onChange(instance.getHTML());
        },
    });

    // Keep the editor in sync if `value` is changed externally (e.g. reset).
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
    }, [value, editor]);

    const handleImageUpload = useCallback(
        async (files: FileList | null) => {
            const file = files?.[0];
            if (!file || !editor) return;
            setBusy('Uploading image...');
            try {
                const url = await uploadImage(file);
                editor.chain().focus().setImage({ src: url, alt: file.name }).run();
            } finally {
                setBusy(null);
                if (imageInputRef.current) imageInputRef.current.value = '';
            }
        },
        [editor],
    );

    const handleDocxImport = useCallback(
        async (files: FileList | null) => {
            const file = files?.[0];
            if (!file || !editor) return;
            setBusy('Importing Word document...');
            try {
                const arrayBuffer = await file.arrayBuffer();
                const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

                // Mammoth embeds images as base64; upload them and swap in URLs
                // so the stored body stays clean.
                const parsed = new DOMParser().parseFromString(html, 'text/html');
                const images = Array.from(
                    parsed.querySelectorAll<HTMLImageElement>('img[src^="data:"]'),
                );
                await Promise.all(
                    images.map(async (img, index) => {
                        const asFile = dataUriToFile(img.src, `word-image-${index + 1}`);
                        if (!asFile) return;
                        try {
                            img.src = await uploadImage(asFile);
                        } catch {
                            // Leave the data URI if the upload fails.
                        }
                    }),
                );

                editor.commands.setContent(parsed.body.innerHTML, {
                    emitUpdate: true,
                });
                onChange(editor.getHTML());
            } finally {
                setBusy(null);
                if (docxInputRef.current) docxInputRef.current.value = '';
            }
        },
        [editor, onChange],
    );

    const setLink = useCallback(() => {
        if (!editor) return;
        const previous = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Enter link URL', previous ?? 'https://');
        if (url === null) return;
        if (url === '' || url === 'https://') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
    }, [editor]);

    const insertChartBlock = useCallback(() => {
        if (!editor) return;
        editor
            .chain()
            .focus()
            .insertContent({
                type: 'chart',
                attrs: {
                    chartType: chart.type,
                    chartTitle: chart.title,
                    chartLabels: chart.labels,
                    chartValues: chart.values,
                },
            })
            .run();
        setChartOpen(false);
    }, [editor, chart]);

    if (!mounted || !editor) {
        // Placeholder keeps layout stable until the editor mounts on the client.
        return (
            <div
                className={cn(
                    'min-h-[24rem] rounded-2xl border border-border bg-background',
                    className,
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-2xl border border-border bg-background',
                className,
            )}
        >
            <Toolbar editor={editor} onSetLink={setLink} />

            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-2 py-2">
                <ToolButton
                    onClick={() => imageInputRef.current?.click()}
                    title="Insert image"
                >
                    <PhotoIcon className="size-4" />
                </ToolButton>
                <ToolButton
                    onClick={() => setChartOpen((open) => !open)}
                    title="Insert chart"
                    active={chartOpen}
                >
                    <TableCellsIcon className="size-4" />
                </ToolButton>
                <ToolButton
                    onClick={() => docxInputRef.current?.click()}
                    title="Import Word (.docx)"
                >
                    <DocumentIcon className="size-4" />
                    <span className="ml-1 text-xs">.docx</span>
                </ToolButton>
                {busy ? (
                    <span className="text-xs text-muted-foreground">{busy}</span>
                ) : null}
            </div>

            {chartOpen ? (
                <EditorChartPanel
                    chart={chart}
                    onChange={setChart}
                    onInsert={insertChartBlock}
                />
            ) : null}

            <EditorContent editor={editor} dir={dir} className="article-editor-content" />

            {/* Submitted values (the editor itself is not a native field). */}
            <input type="hidden" name={name} value={value} />
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
            />
            <input
                ref={docxInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => handleDocxImport(e.target.files)}
            />
        </div>
    );
}
