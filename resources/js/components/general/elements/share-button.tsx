import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { ArrowUpTrayIcon, CheckIcon, LinkIcon } from '@heroicons/react/24/outline';

interface ShareButtonProps {
    /** Absolute URL of the article page to share. */
    url: string;
    title?: string;
    className?: string;
}

/**
 * Replaces the old "Copy content" action. Uses the native share sheet where
 * available (mobile / supported desktop browsers) and otherwise copies the page
 * link to the clipboard with brief "Copied!" feedback.
 */
export default function ShareButton({ url, title, className }: ShareButtonProps) {
    const [copiedText, copy] = useClipboard();
    const copied = copiedText === url;

    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title, url });
                return;
            } catch {
                // The user dismissed the share sheet; fall through to copy.
            }
        }

        await copy(url);
    };

    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleShare}
            className={className}
        >
            {copied ? (
                <CheckIcon className="size-4" aria-hidden="true" />
            ) : (
                <ArrowUpTrayIcon className="size-4" aria-hidden="true" />
            )}
            {copied ? 'Link copied' : 'Share'}
            {!copied && typeof navigator !== 'undefined' && !navigator.share ? (
                <LinkIcon className="size-3.5 opacity-60" aria-hidden="true" />
            ) : null}
        </Button>
    );
}
