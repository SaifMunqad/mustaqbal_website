/**
 * Public site layout: fixed navbar, scrolling content and the site footer.
 *
 * The document itself does not scroll; the inner wrapper does, with offsets
 * (`mt-11` + `pt-7`) chosen to match the fixed navbar height so the scrollbar
 * starts directly beneath it with no dead gap.
 */
// layouts/app/main-layout.tsx
import Footer from '@/components/general/footer/footer';
import Navbar from '@/components/general/header/navbar';
import { usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useRef } from 'react';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { url } = usePage();

    /**
     * Inertia only restores scroll for the document (`window`), but this layout
     * scrolls an inner container instead. React reuses the same container node
     * across school-site navigations, so without this its `scrollTop` leaks into
     * the next page and it opens mid-scroll. Reset to the top on every page
     * change. Keyed on the URL, so `preserveScroll` navigations (which leave the
     * URL untouched) are correctly left alone; a URL hash scrolls to that anchor
     * instead of the very top.
     */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const hash = url.split('#')[1];
        if (hash) {
            const target = document.getElementById(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }

        el.scrollTo({ top: 0, behavior: 'smooth' });
    }, [url]);

    return (
        <div className="flex h-svh flex-col bg-[#FDFDFC] dark:bg-[#0a0a0a]">
            <Navbar />
            {/* mt-11 ~= the fixed navbar's real height (~2.75rem), so the thin
                scrollbar begins right under the nav bar with no dead gap. */}
            <div
                ref={scrollRef}
                className="scrollbar-thin mt-11 min-h-0 flex-1 overflow-y-auto"
            >
                {/* pt-7 restores the content's original top position:
                    mt-11 + pt-7 == the previous mt-18 (4.5rem). */}
                <div className="space-y-3 pt-7 pb-6 md:space-y-5">
                    <main className={'mx-auto px-4 md:px-2 lg:px-3 max-w-400'}>
                        {children}
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
