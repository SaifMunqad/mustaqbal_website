/**
 * Shared Tailwind classes for the header's chrome controls. These are reused by
 * the icon buttons (search, language, mobile menu) and the text login button so
 * the navbar stays visually consistent without repeating the long class strings.
 */

// Square icon-only control (search, language switcher, mobile menu toggle).
export const navIconButtonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/40 bg-white/20 text-slate-700 transition-all duration-300 hover:bg-white/40 dark:border-gray-700/40 dark:bg-gray-800/20 dark:text-slate-200 dark:hover:bg-gray-800/40';

// Compact text control (the guest "Login" link).
export const navTextButtonClass =
    'rounded-xl border border-gray-200/40 bg-white/20 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-white/40 dark:border-gray-700/40 dark:bg-gray-800/20 dark:text-slate-200 dark:hover:bg-gray-800/40';
