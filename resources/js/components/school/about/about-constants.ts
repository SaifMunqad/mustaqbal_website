import {
    BookOpen,
    GraduationCap,
    HeartHandshake,
    ShieldCheck,
    Sparkles,
    Users,
    type LucideIcon,
} from 'lucide-react';

// Rotating accent tints keep adjacent tiles visually varied rather than uniform.
export const ACCENTS = [
    'bg-brand-soft-strong text-brand-ink dark:bg-brand/15',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
];

// Map the seeded `icon` keys to Lucide components; unknown keys fall back to a
// friendly default (Sparkles) so a tile always renders an icon.
export const VALUE_ICONS: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    sparkles: Sparkles,
    'heart-handshake': HeartHandshake,
    users: Users,
    'shield-check': ShieldCheck,
    'graduation-cap': GraduationCap,
};
