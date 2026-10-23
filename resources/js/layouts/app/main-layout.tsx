// layouts/app/main-layout.tsx
import Footer from '@/components/general/footer/footer';
import Navbar from '@/components/general/header/navbar';
import { ReactNode } from 'react';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex h-svh flex-col bg-[#FDFDFC] dark:bg-[#0a0a0a]">
            <Navbar />
            {/* mt-11 ~= the fixed navbar's real height (~2.75rem), so the thin
                scrollbar begins right under the nav bar with no dead gap. */}
            <div className="scrollbar-thin mt-11 min-h-0 flex-1 overflow-y-auto">
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
