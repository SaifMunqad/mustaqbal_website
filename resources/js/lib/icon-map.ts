import {
    BookOpen,
    Building2,
    GraduationCap,
    HeartHandshake,
    ShieldCheck,
    Sparkles,
    Users,
    type LucideIcon,
} from 'lucide-react';

/**
 * Resolve an admin-selected icon key to a Lucide component. The set is shared
 * by the home feature grid and the builder's icon-card block, so the same keys
 * work everywhere; unknown or blank values fall back to a friendly default.
 */
const ICON_MAP: Record<string, LucideIcon> = {
    faculty: Users,
    values: HeartHandshake,
    facilities: Building2,
    classes: GraduationCap,
    'book-open': BookOpen,
    sparkles: Sparkles,
    'heart-handshake': HeartHandshake,
    users: Users,
    'shield-check': ShieldCheck,
    'graduation-cap': GraduationCap,
};

export function resolveIcon(key?: string | null): LucideIcon {
    return ICON_MAP[key ?? ''] ?? Sparkles;
}

/**
 * The keys the editor offers in an icon picker. Derived from ICON_MAP so a new
 * glyph is selectable as soon as it is registered — a typo-proof replacement
 * for the old free-text "icon key" input.
 */
export const ICON_OPTIONS: Array<{ value: string; label: string }> = Object.keys(
    ICON_MAP,
).map((value) => ({
    value,
    label: value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
}));
