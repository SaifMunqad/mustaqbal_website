// Content shapes for the admin-authored About page (see the site-pages seeder).

export interface Stat {
    value: string;
    label: string;
}

export interface ValueItem {
    icon?: string;
    title: string;
    text?: string;
}

export interface Highlight {
    title: string;
    text?: string;
}

export interface LeadershipMessage {
    text?: string;
    author_name?: string;
    author_role?: string;
    author_image?: string;
}

export interface FaqItem {
    question?: string;
    answer?: string;
}

export interface AboutContent {
    intro?: string;
    body?: string;
    mission?: string;
    vision?: string;
    manager_message?: string;
    stats?: Stat[];
    values?: ValueItem[];
    highlights?: Highlight[];
    goals?: string[];
    main_points?: string[];
    message?: LeadershipMessage;
    faq?: FaqItem[];
    video_embed?: string;
}

export interface AboutPageData {
    title: string;
    hero_image?: string;
    content?: AboutContent;
}
