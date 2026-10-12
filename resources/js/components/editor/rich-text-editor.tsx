import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import mammoth from 'mammoth';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    BoldIcon,
    CodeBracketIcon,
    DocumentIcon,
    ItalicIcon,
    LinkIcon,
    ListBulletIcon,
    PhotoIcon,
    TableCellsIcon,
    TrashIcon,
    UnderlineIcon,
} from '@heroicons/react/24/outline';
import Chart from '@/components/editor/extensions/chart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadImage } from '@/lib/upload';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    /** Form field name; a hidden input with this name carries the HTML value. */
    name: string;
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

const CHART_TYPES = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' },
    { value: 'pie', label: 'Pie' },
    { value: 'doughnut', label: 'Doughnut' },
];

/** Convert a data: URI produced by Mammoth into a File for upload. */
function dataUriToFile(dataUri: string, fallbackName: string): File | null {
    const match = /^data:(?<mime>[^;]+);base64,(?<b64>.*)$/.exec(dataUri);
    if (!match?.groups) return null;
    try {
        const binary = atob(match.groups.b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: match.groups.mime });
        const ext = match.groups.mime.split('/')[1] ?? 'png';
        return new File([blob], fallbackName || `image.${ext}`, {
            type: match.groups.mime,
        });
    } catch {
        return null;
    }
}

export default function RichTextEditor({
    name,
    value,
    onChange,
    placeholder = 'Write your article here, or import a Word document / paste from Word...',
    className,
}: RichTextEditorProps) {
    const [mounted, setMounted] = useState(false);
    const [chartOpen, setChartOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [chart, setChart] = useState({
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
                <div className="grid gap-2 border-b border-border bg-muted/20 p-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                        Type
                        <select
                            className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                            value={chart.type}
                            onChange={(e) =>
                                setChart((c) => ({ ...c, type: e.target.value }))
                            }
                        >
                            {CHART_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                        Title
                        <Input
                            value={chart.title}
                            onChange={(e) =>
                                setChart((c) => ({ ...c, title: e.target.value }))
                            }
                            placeholder="Sales per quarter"
                        />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                        Labels (comma separated)
                        <Input
                            value={chart.labels}
                            onChange={(e) =>
                                setChart((c) => ({ ...c, labels: e.target.value }))
                            }
                            placeholder="Q1, Q2, Q3, Q4"
                        />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                        Values (comma separated)
                        <Input
                            value={chart.values}
                            onChange={(e) =>
                                setChart((c) => ({ ...c, values: e.target.value }))
                            }
                            placeholder="12, 19, 7, 22"
                        />
                    </label>
                    <div className="sm:col-span-2">
                        <Button type="button" size="sm" onClick={insertChartBlock}>
                            Insert chart
                        </Button>
                    </div>
                </div>
            ) : null}

            <EditorContent editor={editor} className="article-editor-content" />

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

function Toolbar({
    editor,
    onSetLink,
}: {
    editor: Editor;
    onSetLink: () => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
            <ToolButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
            >
                <span className="text-xs font-bold">H1</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
            >
                <span className="text-xs font-bold">H2</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
            >
                <span className="text-xs font-bold">H3</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().setParagraph().run()}
                active={editor.isActive('paragraph')}
                title="Paragraph"
            >
                <span className="text-xs">P</span>
            </ToolButton>

            <Divider />

            <ToolButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
                title="Bold"
            >
                <BoldIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                title="Italic"
            >
                <ItalicIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive('underline')}
                title="Underline"
            >
                <UnderlineIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive('strike')}
                title="Strikethrough"
            >
                <span className="text-sm font-semibold line-through">S</span>
            </ToolButton>

            <Divider />

            <ToolButton onClick={onSetLink} active={editor.isActive('link')} title="Link">
                <LinkIcon className="size-4" />
            </ToolButton>
            {editor.isActive('link') ? (
                <ToolButton
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    title="Remove link"
                >
                    <TrashIcon className="size-4" />
                </ToolButton>
            ) : null}

            <Divider />

            <ToolButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                title="Bullet list"
            >
                <ListBulletIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive('orderedList')}
                title="Numbered list"
            >
                <span className="text-xs font-semibold">1.</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive('blockquote')}
                title="Quote"
            >
                <CodeBracketIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive('codeBlock')}
                title="Code block"
            >
                <CodeBracketIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Divider"
            >
                <span className="text-xs">&#8213;</span>
            </ToolButton>

            <Divider />

            <ToolButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                active={editor.isActive({ textAlign: 'left' })}
                title="Align left"
            >
                <span className="text-xs">&#8676;</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                active={editor.isActive({ textAlign: 'center' })}
                title="Align center"
            >
                <span className="text-xs">&#8596;</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                active={editor.isActive({ textAlign: 'right' })}
                title="Align right"
            >
                <span className="text-xs">&#8677;</span>
            </ToolButton>

            <Divider />

            <ToolButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
            >
                <span className="text-xs">&#8630;</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
            >
                <span className="text-xs">&#8631;</span>
            </ToolButton>
        </div>
    );
}

function ToolButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                'inline-flex min-h-8 items-center justify-center rounded-md px-2 text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
                active && 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />;
}
