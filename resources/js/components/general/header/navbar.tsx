import {
    AcademicCapIcon,
    ChartBarIcon,
    DocumentTextIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { ComponentType, useEffect, useState } from 'react';

function NavDesktopElement({
    link,
    icon: Icon,
    name,
}: {
    link: string;
    icon: ComponentType<{ className?: string }>;
    name: string;
}) {
    return (
        <li className="flex items-center gap-x-2 p-1 text-sm text-slate-600">
            <Icon className="h-6 w-6 text-slate-500" />
            <a href={link} className="flex items-center">
                {name}
            </a>
        </li>
    );
}
export default function Navbar() {
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Check if user has scrolled more than 10px
            if (window.scrollY > 20) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Cleanup
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const navItems = [
        {
            link: '#',
            icon: DocumentTextIcon,
            name: 'Pages',
        },

        {
            link: '#',
            icon: ChartBarIcon,
            name: 'Blocks',
        },
        {
            link: '#',
            icon: AcademicCapIcon,
            name: 'Docs',
        },
        {
            link: '#',
            icon: UserIcon,
            name: 'Account',
        },
    ];

    return (
        <nav
            className={`sticky top-0 z-50 mx-auto block w-full rounded-2xl border border-gray-800 px-4 py-2 shadow-md transition-all duration-300 lg:px-8 lg:py-3 ${
                isSticky
                    ? 'top-3 border-white/20 bg-white/10 backdrop-blur-lg backdrop-saturate-150 dark:bg-gray-900/30'
                    : 'bg-opacity-90 bg-white backdrop-blur-lg backdrop-saturate-150 dark:bg-[#181818]'
            }`}
        >
            <div className="container mx-auto flex flex-wrap items-center justify-between text-slate-800">
                <Link
                    href="/"
                    className={`mr-4 block cursor-pointer py-1.5 text-base font-semibold transition-colors duration-300 ${
                        isSticky
                            ? 'text-white'
                            : 'text-slate-800 dark:text-white'
                    }`}
                >
                    Mustaqbal
                </Link>

                <div className="hidden lg:block">
                    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mt-0 lg:mb-0 lg:flex-row lg:items-center lg:gap-6">
                        {navItems.map((item, index) => (
                            <NavDesktopElement
                                key={index}
                                link={item.link}
                                icon={item.icon}
                                name={item.name}
                            />
                        ))}
                    </ul>
                </div>

                <button
                    className={`relative ml-auto h-6 max-h-[40px] w-6 max-w-[40px] rounded-lg text-center align-middle text-xs font-medium uppercase transition-all select-none hover:bg-transparent focus:bg-transparent active:bg-transparent disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none lg:hidden ${
                        isSticky ? 'text-white' : 'text-inherit'
                    }`}
                    type="button"
                >
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6h16M4 12h16M4 18h16"
                            ></path>
                        </svg>
                    </span>
                </button>
            </div>
        </nav>
    );
}
