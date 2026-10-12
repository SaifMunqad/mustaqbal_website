import {
    AcademicCapIcon,
    BookOpenIcon,
    BuildingLibraryIcon,
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    EnvelopeIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    ShoppingBagIcon,
    TrophyIcon,
} from '@heroicons/react/24/outline';
import { ComponentType } from 'react';

export type LanguageCode = string;

export interface NavigationChildItem {
    key: string;
    name: string;
    nameKey: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    descriptionKey?: string;
}

export interface NavigationItem {
    key: string;
    name: string;
    nameKey: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    dropdown?: NavigationChildItem[];
}

export interface FooterSection {
    key: string;
    titleKey: string;
    links: Array<{
        key: string;
        labelKey: string;
        href: string;
    }>;
}

export const navigationItems: NavigationItem[] = [
    {
        key: 'home',
        name: 'Home',
        nameKey: 'navigation.home',
        href: '/',
        icon: HomeIcon,
    },
    {
        key: 'school',
        name: 'School',
        nameKey: 'navigation.school',
        href: '/school/about',
        icon: AcademicCapIcon,
        dropdown: [
            {
                key: 'about',
                name: 'About',
                nameKey: 'navigation.about',
                descriptionKey: 'navigationDescriptions.about',
                href: '/school/about',
                icon: BuildingLibraryIcon,
            },
            {
                key: 'programs',
                name: 'Programs',
                nameKey: 'navigation.programs',
                descriptionKey: 'navigationDescriptions.programs',
                href: '/school/programs',
                icon: AcademicCapIcon,
            },
            {
                key: 'showcase',
                name: 'Showcase',
                nameKey: 'navigation.showcase',
                descriptionKey: 'navigationDescriptions.showcase',
                href: '/school/showcase',
                icon: TrophyIcon,
            },
            {
                key: 'events',
                name: 'Events',
                nameKey: 'navigation.events',
                descriptionKey: 'navigationDescriptions.events',
                href: '/school/events',
                icon: CalendarDaysIcon,
            },
            {
                key: 'articles',
                name: 'Articles',
                nameKey: 'navigation.articles',
                descriptionKey: 'navigationDescriptions.articles',
                href: '/school/articles',
                icon: BookOpenIcon,
            },
            {
                key: 'enroll',
                name: 'Enroll',
                nameKey: 'navigation.enroll',
                descriptionKey: 'navigationDescriptions.enroll',
                href: '/school/enroll',
                icon: ClipboardDocumentCheckIcon,
            },
            {
                key: 'contact',
                name: 'Contact',
                nameKey: 'navigation.contact',
                descriptionKey: 'navigationDescriptions.contact',
                href: '/school/contact',
                icon: PhoneIcon,
            },
        ],
    },
    {
        key: 'articles',
        name: 'Articles',
        nameKey: 'navigation.articles',
        href: '/school/articles',
        icon: BookOpenIcon,
    },
    {
        key: 'events',
        name: 'Events',
        nameKey: 'navigation.events',
        href: '/school/events',
        icon: CalendarDaysIcon,
    },
    {
        key: 'store',
        name: 'Bookstore',
        nameKey: 'navigation.store',
        href: '/store',
        icon: ShoppingBagIcon,
    },
    {
        key: 'search',
        name: 'Search',
        nameKey: 'navigation.search',
        href: '/school/search',
        icon: MagnifyingGlassIcon,
    },
    {
        key: 'contact',
        name: 'Contact',
        nameKey: 'navigation.contact',
        href: '/school/contact',
        icon: EnvelopeIcon,
    },
];

export const footerSections: FooterSection[] = [
    {
        key: 'school',
        titleKey: 'footer.school',
        links: [
            { key: 'about', labelKey: 'navigation.about', href: '/school/about' },
            {
                key: 'programs',
                labelKey: 'navigation.programs',
                href: '/school/programs',
            },
            {
                key: 'articles',
                labelKey: 'navigation.articles',
                href: '/school/articles',
            },
            { key: 'enroll', labelKey: 'navigation.enroll', href: '/school/enroll' },
            { key: 'showcase', labelKey: 'navigation.showcase', href: '/school/showcase' },
            { key: 'events', labelKey: 'navigation.events', href: '/school/events' },
            { key: 'store', labelKey: 'navigation.store', href: '/store' },
        ],
    },
    {
        key: 'support',
        titleKey: 'footer.support',
        links: [
            { key: 'contact', labelKey: 'navigation.contact', href: '/school/contact' },
            { key: 'phone1', labelKey: 'footer.phoneMain', href: 'tel:+93700000001' },
            {
                key: 'phone2',
                labelKey: 'footer.phoneSecondary',
                href: 'tel:+93799000001',
            },
        ],
    },
    {
        key: 'legal',
        titleKey: 'footer.legal',
        links: [
            {
                key: 'privacy',
                labelKey: 'footer.privacyPolicy',
                href: '/school/privacy-policy',
            },
            {
                key: 'terms',
                labelKey: 'footer.terms',
                href: '/school/terms-and-conditions',
            },
        ],
    },
];
