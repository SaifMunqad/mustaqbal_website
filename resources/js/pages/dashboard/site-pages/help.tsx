import DashboardPage from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import sitePages from '@/routes/dashboard/site-pages';
import {
    ArrowLeftIcon,
    BookOpenIcon,
    CommandLineIcon,
    PhotoIcon,
    RocketLaunchIcon,
    RectangleStackIcon,
    SparklesIcon,
    LinkIcon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface StepProps {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}

function Step({ icon, title, children }: StepProps) {
    return (
        <section className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                {icon}
            </span>
            <div className="space-y-1.5">
                <h2 className="text-base font-semibold text-foreground">
                    {title}
                </h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                    {children}
                </div>
            </div>
        </section>
    );
}

function Kbd({ children }: { children: ReactNode }) {
    return (
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {children}
        </kbd>
    );
}

export default function DashboardSitePagesHelp() {
    return (
        <DashboardPage titleKey="dashboard.pages.helpTitle">
            <div className="mx-auto max-w-3xl space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        A quick guide to writing site pages such as About, from
                        the dashboard.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={sitePages.index.url()}>
                            <ArrowLeftIcon className="size-4" />
                            Back to pages
                        </Link>
                    </Button>
                </div>

                <Step
                    icon={<RectangleStackIcon className="size-5" />}
                    title="Choose the page"
                >
                    <p>
                        Go to{' '}
                        <Link
                            href={sitePages.index.url()}
                            className="font-medium text-blue-600 underline"
                        >
                            Pages
                        </Link>{' '}
                        and pick an existing page (for example{' '}
                        <strong>About</strong>) to edit, or select{' '}
                        <strong>New Page</strong> to create one.
                    </p>
                </Step>

                <Step
                    icon={<CommandLineIcon className="size-5" />}
                    title="Understand the Slug and Title"
                >
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            <strong>Title</strong> is the big heading shown at
                            the top of the page.
                        </li>
                        <li>
                            <strong>Slug</strong> becomes the page's web address.
                            A slug of{' '}
                            <Kbd>about</Kbd> appears at{' '}
                            <Kbd>/about</Kbd>. Use lowercase letters, numbers and
                            dashes only, and avoid changing it once the page is
                            published (the old address would stop working).
                        </li>
                    </ul>
                </Step>

                <Step
                    icon={<BookOpenIcon className="size-5" />}
                    title="Write the content"
                >
                    <p>
                        Type directly in the editor like you would for an
                        article. The toolbar lets you add headings, bold /
                        italic / underline text, lists, links and tables, and
                        align text.
                    </p>
                </Step>

                <Step
                    icon={<SparklesIcon className="size-5" />}
                    title="Import a Word (.docx) file"
                >
                    <p>
                        Already wrote the page in Word? Click the{' '}
                        <strong>.docx</strong> button in the toolbar to convert
                        a Word document into formatted text automatically —
                        including its images, headings, lists and links. You can
                        also copy from Word and paste straight into the editor.
                    </p>
                    <p className="text-xs">
                        Note: complex Word layouts are simplified to clean web
                        formatting. Always preview after an import.
                    </p>
                </Step>

                <Step
                    icon={<PhotoIcon className="size-5" />}
                    title="Add images"
                >
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            <strong>Inline images:</strong> use the image button
                            in the toolbar to place a picture inside the text.
                        </li>
                        <li>
                            <strong>Hero image:</strong> the large banner at the
                            very top of the page is set separately in the{' '}
                            <strong>Hero image</strong> section. Upload a file
                            or paste an existing URL.
                        </li>
                    </ul>
                </Step>

                <Step
                    icon={<LinkIcon className="size-5" />}
                    title="Tips for good pages"
                >
                    <ul className="list-disc space-y-1 pl-5">
                        <li>Use short headings to break long text into sections.</li>
                        <li>Keep paragraphs concise; the About page is often read on phones.</li>
                        <li>Add links with the link button so URLs open safely in a new tab.</li>
                    </ul>
                </Step>

                <Step
                    icon={<RocketLaunchIcon className="size-5" />}
                    title="Save and publish"
                >
                    <p>
                        Tick <strong>Publish</strong> to make the page visible to
                        visitors, then press <strong>Save</strong> /{' '}
                        <strong>Update page</strong> in the bottom bar. Leave it
                        unticked to keep a private draft.
                    </p>
                </Step>
            </div>
        </DashboardPage>
    );
}
