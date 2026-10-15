import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface TextEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    label: string;
    /** Name of the language being edited (shown in the sub-heading). */
    languageName: string;
    dir: 'ltr' | 'rtl';
    value: string;
    multiline?: boolean;
    /** Present when the language has no row yet, so the admin knows blanks fall back. */
    untranslatedHint?: string;
    onSave: (value: string) => void;
}

/**
 * Click-to-edit dialog for one localized field. Edits only the active editing
 * language; leaving it blank keeps the language un-authored so the live site
 * falls back to the default language (never writes the fallback text here).
 *
 * The parent remounts this (via `key`) whenever the target block, field or
 * language changes, so `useState(value)` always seeds from the right text
 * without a state-in-effect cascade.
 */
export default function TextEditDialog({
    open,
    onOpenChange,
    label,
    languageName,
    dir,
    value,
    multiline,
    untranslatedHint,
    onSave,
}: TextEditDialogProps) {
    const [draft, setDraft] = useState(value);

    const commit = () => {
        onSave(draft);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir={dir}>
                <DialogHeader>
                    <DialogTitle>{label}</DialogTitle>
                    <DialogDescription>
                        Editing in <span className="font-semibold">{languageName}</span>.
                    </DialogDescription>
                </DialogHeader>

                {untranslatedHint ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        {untranslatedHint}
                    </p>
                ) : null}

                {multiline ? (
                    <Textarea
                        rows={5}
                        dir={dir}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        autoFocus
                    />
                ) : (
                    <Input
                        dir={dir}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        autoFocus
                    />
                )}

                <DialogFooter>
                    <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={commit}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
