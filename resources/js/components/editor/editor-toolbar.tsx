/**
 * Formatting toolbar for `RichTextEditor`.
 *
 * Exports the small `ToolButton` and `Divider` atoms so callers can extend the
 * toolbar without re-implementing the active/inactive styling.
 */
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
    BoldIcon,
    CodeBracketIcon,
    ItalicIcon,
    LinkIcon,
    ListBulletIcon,
    TrashIcon,
    UnderlineIcon,
} from '@heroicons/react/24/outline';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: ReactNode;
}

export function ToolButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: ToolButtonProps) {
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

export function Divider() {
    return <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />;
}

interface ToolbarProps {
    editor: Editor;
    onSetLink: () => void;
}

/** Formatting toolbar: headings, marks, lists, alignment, and undo/redo. */
export default function Toolbar({ editor, onSetLink }: ToolbarProps) {
    const { t } = useTranslation();

    // Subscribe to the editor state so the toolbar re-renders whenever the
    // selection or active marks/nodes change. Reading `editor.isActive()`
    // directly during render is not enough on its own: TipTap v3 does not
    // re-render consumers on every transaction by default, which left the
    // active button states frozen (H1 applied visually but its button never
    // highlighted, and P stayed "selected"). Deriving the flags here makes the
    // highlighted state track the current selection reliably.
    const active = useEditorState({
        editor,
        selector: ({ editor: instance }) => {
            if (!instance) {
                return {
                    h1: false,
                    h2: false,
                    h3: false,
                    paragraph: false,
                    bold: false,
                    italic: false,
                    underline: false,
                    strike: false,
                    link: false,
                    bulletList: false,
                    orderedList: false,
                    blockquote: false,
                    codeBlock: false,
                    alignLeft: false,
                    alignCenter: false,
                    alignRight: false,
                    canUndo: false,
                    canRedo: false,
                };
            }

            return {
                h1: instance.isActive('heading', { level: 1 }),
                h2: instance.isActive('heading', { level: 2 }),
                h3: instance.isActive('heading', { level: 3 }),
                paragraph: instance.isActive('paragraph'),
                bold: instance.isActive('bold'),
                italic: instance.isActive('italic'),
                underline: instance.isActive('underline'),
                strike: instance.isActive('strike'),
                link: instance.isActive('link'),
                bulletList: instance.isActive('bulletList'),
                orderedList: instance.isActive('orderedList'),
                blockquote: instance.isActive('blockquote'),
                codeBlock: instance.isActive('codeBlock'),
                alignLeft: instance.isActive({ textAlign: 'left' }),
                alignCenter: instance.isActive({ textAlign: 'center' }),
                alignRight: instance.isActive({ textAlign: 'right' }),
                canUndo: instance.can().undo(),
                canRedo: instance.can().redo(),
            };
        },
    });

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
            <ToolButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={active.h1}
                title={t('editor.heading1')}
            >
                <span className="text-xs font-bold">H1</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={active.h2}
                title={t('editor.heading2')}
            >
                <span className="text-xs font-bold">H2</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={active.h3}
                title={t('editor.heading3')}
            >
                <span className="text-xs font-bold">H3</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().setParagraph().run()}
                active={active.paragraph}
                title={t('editor.paragraph')}
            >
                <span className="text-xs">P</span>
            </ToolButton>

            <Divider />

            <ToolButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={active.bold}
                title={t('editor.bold')}
            >
                <BoldIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={active.italic}
                title={t('editor.italic')}
            >
                <ItalicIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={active.underline}
                title={t('editor.underline')}
            >
                <UnderlineIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={active.strike}
                title={t('editor.strikethrough')}
            >
                <span className="text-sm font-semibold line-through">S</span>
            </ToolButton>

            <Divider />

            <ToolButton onClick={onSetLink} active={active.link} title={t('editor.link')}>
                <LinkIcon className="size-4" />
            </ToolButton>
            {active.link ? (
                <ToolButton
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    title={t('editor.removeLink')}
                >
                    <TrashIcon className="size-4" />
                </ToolButton>
            ) : null}

            <Divider />

            <ToolButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={active.bulletList}
                title={t('editor.bulletList')}
            >
                <ListBulletIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={active.orderedList}
                title={t('editor.numberedList')}
            >
                <span className="text-xs font-semibold">1.</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={active.blockquote}
                title={t('editor.quote')}
            >
                <CodeBracketIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={active.codeBlock}
                title={t('editor.codeBlock')}
            >
                <CodeBracketIcon className="size-4" />
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title={t('editor.divider')}
            >
                <span className="text-xs">&#8213;</span>
            </ToolButton>

            <Divider />

            <ToolButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                active={active.alignLeft}
                title={t('editor.alignLeft')}
            >
                <span className="text-xs">&#8676;</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                active={active.alignCenter}
                title={t('editor.alignCenter')}
            >
                <span className="text-xs">&#8596;</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                active={active.alignRight}
                title={t('editor.alignRight')}
            >
                <span className="text-xs">&#8677;</span>
            </ToolButton>

            <Divider />

            <ToolButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!active.canUndo}
                title={t('editor.undo')}
            >
                <span className="text-xs">&#8630;</span>
            </ToolButton>
            <ToolButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!active.canRedo}
                title={t('editor.redo')}
            >
                <span className="text-xs">&#8631;</span>
            </ToolButton>
        </div>
    );
}
