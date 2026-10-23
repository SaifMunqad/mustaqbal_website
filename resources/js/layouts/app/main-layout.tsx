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
            {/* Start the scroll region (and its scrollbar) below the fixed
                navbar via a top offset, so the thin scrollbar is never
                hidden under the nav bar. mt-18 == the navbar's reserved height. */}
            <div className="scrollbar-thin mt-18 min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-3 pb-6 md:space-y-5">
                    <main className={'mx-auto px-4 md:px-2 lg:px-3 max-w-400'}>
                        {children}
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
