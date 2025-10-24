// layouts/app/main-layout.tsx
import Footer from '@/components/general/footer/footer';
import Navbar from '@/components/general/header/navbar';
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default function MainLayout({ children }: Props) {
    return (
        <div className="space-y-3 bg-[#FDFDFC] p-2 sm:p-4 md:space-y-5 md:p-6 lg:p-8 dark:bg-[#0a0a0a]">
            <Navbar />
            <main className={'mx-auto px-1 md:px-2 lg:px-3'}>{children}</main>
            <Footer />
        </div>
    );
}
