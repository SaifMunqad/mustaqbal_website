import { ReactNode, useMemo, useState } from 'react';

type SortDirection = 'asc' | 'desc';

type SortValue = string | number | boolean | null | undefined;

export interface DataTableColumn<T> {
    key: string;
    header: string;
    cell: (row: T) => ReactNode;
    sortValue?: (row: T) => SortValue;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    rowKey: (row: T) => string | number;
    emptyMessage?: string;
    defaultSort?: {
        key: string;
        direction?: SortDirection;
    };
}

export function DataTable<T>({
    data,
    columns,
    rowKey,
    emptyMessage = 'No records found.',
    defaultSort,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSort?.direction ?? 'asc');

    const sortedData = useMemo(() => {
        if (!sortKey) {
            return data;
        }

        const column = columns.find((entry) => entry.key === sortKey);
        if (!column?.sortValue) {
            return data;
        }

        const copy = [...data];
        copy.sort((a, b) => {
            const first = normalizeSortValue(column.sortValue?.(a));
            const second = normalizeSortValue(column.sortValue?.(b));

            if (first < second) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (first > second) {
                return sortDirection === 'asc' ? 1 : -1;
            }

            return 0;
        });

        return copy;
    }, [columns, data, sortDirection, sortKey]);

    const handleSort = (column: DataTableColumn<T>) => {
        if (!column.sortValue) {
            return;
        }

        if (sortKey !== column.key) {
            setSortKey(column.key);
            setSortDirection('asc');
            return;
        }

        setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    };

    return (
        <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                        {columns.map((column) => {
                            const isActive = sortKey === column.key;

                            return (
                                <th key={column.key} className={`p-3 text-left ${column.className ?? ''}`}>
                                    {column.sortValue ? (
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 font-medium"
                                            onClick={() => handleSort(column)}
                                        >
                                            {column.header}
                                            {isActive ? (
                                                <span className="text-xs text-slate-500 dark:text-slate-300">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    ) : (
                                        column.header
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.length > 0 ? (
                        sortedData.map((row) => (
                            <tr key={rowKey(row)} className="border-t">
                                {columns.map((column) => (
                                    <td key={column.key} className={`p-3 ${column.className ?? ''}`}>
                                        {column.cell(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr className="border-t">
                            <td className="p-3 text-slate-500 dark:text-slate-300" colSpan={columns.length}>
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function normalizeSortValue(value: SortValue): string | number {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    return (value ?? '').toString().toLowerCase();
}

