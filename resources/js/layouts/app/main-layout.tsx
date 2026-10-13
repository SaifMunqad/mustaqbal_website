// layouts/app/main-layout.tsx
import Footer from '@/components/general/footer/footer';
import Navbar from '@/components/general/header/navbar';
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default function MainLayout({ children }: Props) {
    return (
        <div className="space-y-3 bg-[#FDFDFC] md:space-y-5 dark:bg-[#0a0a0a]">
            <Navbar />
            <main className={'mx-auto px-4 md:px-2 lg:px-3 mt-18 max-w-400'}>{children}</main>
            <Footer />
        </div>
    );
}
