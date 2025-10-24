import { ReactNode } from 'react';

interface props {
    children: ReactNode;
}
export default function SectionCard({ children }: props) {
    return (
        <>
            <div
                className={
                    'mx-1 min-h-screen rounded-2xl border border-gray-800 bg-gray-100 p-3 shadow-md md:mx-3 md:p-6 lg:mx-4 dark:bg-[#151517]'
                }
            >
                {children}
            </div>
        </>
    );
}
