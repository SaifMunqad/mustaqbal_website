/**
 * Track classes for an admin-chosen column count, shared by every grid-based
 * home block. Written as full literals so Tailwind's scanner emits each variant;
 * `fallback` is the block's designed default when the admin never picked one.
 */

const GRID_COLS: Record<number, string> = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
    6: 'sm:grid-cols-3 lg:grid-cols-6',
};

const MASONRY_COLS: Record<number, string> = {
    1: 'columns-1',
    2: 'columns-1 md:columns-2',
    3: 'columns-2 md:columns-3',
    4: 'columns-2 md:columns-3 lg:columns-4',
    5: 'columns-2 md:columns-4 lg:columns-5',
    6: 'columns-2 md:columns-4 lg:columns-6',
};

export function gridCols(
    columns: number | null | undefined,
    fallback: number,
): string {
    return GRID_COLS[columns ?? fallback] ?? GRID_COLS[fallback];
}

export function masonryCols(
    columns: number | null | undefined,
    fallback: number,
): string {
    return MASONRY_COLS[columns ?? fallback] ?? MASONRY_COLS[fallback];
}
