import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import DateObject from 'react-date-object';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import persian_fa from 'react-date-object/locales/persian_fa';

export type AwardFieldKey =
    | 'person_id'
    | 'award_id'
    | 'full_name'
    | 'father_name'
    | 'awarded_at';

export interface AwardImportRow {
    person_id: string;
    award_id: string;
    full_name: string;
    father_name: string;
    awarded_at: string;
}

export interface AwardImportResult {
    /** Rows ready to post to the server. */
    rows: AwardImportRow[];
    /** Which header was matched for each field, for the "detected" summary. */
    detected: Partial<Record<AwardFieldKey, string>>;
    /** Required columns that could not be found in the header row. */
    missingColumns: AwardFieldKey[];
    /** Rows dropped because a person or award ID was blank. */
    skippedMissingCodes: number;
    /** Rows dropped because the date could not be read. */
    skippedInvalidDate: number;
    /** Rows beyond the server's per-import limit. */
    skippedOverLimit: number;
}

const EMPTY_RESULT: AwardImportResult = {
    rows: [],
    detected: {},
    missingColumns: [],
    skippedMissingCodes: 0,
    skippedInvalidDate: 0,
    skippedOverLimit: 0,
};

const REQUIRED_FIELDS: AwardFieldKey[] = ['person_id', 'award_id', 'full_name', 'awarded_at'];

const normalizeHeader = (value: unknown): string =>
    String(value ?? '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Accepted header spellings per field. Matching is done on a normalized header
 * (lowercased, punctuation and spaces removed), so "Person ID", "person_id"
 * and "Person-Id" all resolve to the same column.
 */
const ALIASES: Record<AwardFieldKey, string[]> = {
    person_id: [
        'personid',
        'person',
        'studentid',
        'student',
        'holderid',
        'holder',
        'idnumber',
        'personnumber',
        'studentnumber',
        'شخص',
        'زدهکوونکی',
        'شخصی',
    ],
    award_id: [
        'awardid',
        'award',
        'awardnumber',
        'certificateid',
        'certificate',
        'certificatenumber',
        'diplomaid',
        'documentid',
        'documentnumber',
        'سند',
        'جایزه',
        'تصدیق',
    ],
    full_name: ['fullname', 'name', 'studentname', 'holdername', 'nameofstudent', 'نوم', 'نام'],
    father_name: ['fathername', 'father', 'parentname', 'دپلارنوم', 'نامپدر'],
    awarded_at: [
        'awardedat',
        'awarddate',
        'date',
        'issuedate',
        'issuedat',
        'graduationdate',
        'certificatedate',
        'نیټه',
        'تاریخ',
    ],
};

const pad = (value: number): string => String(value).padStart(2, '0');

const isRealDate = (year: number, month: number, day: number): boolean => {
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }

    const probe = new Date(Date.UTC(year, month - 1, day));

    return (
        probe.getUTCFullYear() === year &&
        probe.getUTCMonth() === month - 1 &&
        probe.getUTCDate() === day
    );
};

/**
 * Convert a Hijri Shamsi date typed into a spreadsheet to the Gregorian
 * calendar, using the same library as the dashboard date picker.
 */
const fromJalali = (year: number, month: number, day: number): string | null => {
    try {
        const date = new DateObject({
            date: `${year}/${pad(month)}/${pad(day)}`,
            calendar: persian,
            locale: persian_fa,
            format: 'YYYY/MM/DD',
        });

        if (!date.isValid) {
            return null;
        }

        return date.convert(gregorian, gregorian_en).format('YYYY-MM-DD');
    } catch {
        return null;
    }
};

/**
 * Normalize the many ways a date reaches a spreadsheet cell: a real Excel date
 * (serial number), a Date object, an ISO/Latin date, or a hand-typed Hijri
 * Shamsi date. Returns `null` when nothing sensible can be read.
 */
export function parseAwardDate(value: unknown): string | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        const parts = XLSX.SSF.parse_date_code(value);

        if (!parts) {
            return null;
        }

        return isRealDate(parts.y, parts.m, parts.d)
            ? `${parts.y}-${pad(parts.m)}-${pad(parts.d)}`
            : null;
    }

    const match = String(value ?? '')
        .trim()
        .match(/^(\d{3,4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);

    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    // 12xx–15xx can only be Hijri Shamsi; 19xx/20xx are Gregorian.
    if (year >= 1200 && year <= 1599) {
        return fromJalali(year, month, day);
    }

    return isRealDate(year, month, day)
        ? `${year}-${pad(month)}-${pad(day)}`
        : null;
}

const cellText = (value: unknown): string =>
    value === null || value === undefined ? '' : String(value).trim();

function detectColumns(rows: unknown[][]): {
    headerRow: number;
    columns: Partial<Record<AwardFieldKey, number>>;
    labels: Partial<Record<AwardFieldKey, string>>;
} {
    let best = {
        headerRow: -1,
        columns: {} as Partial<Record<AwardFieldKey, number>>,
        labels: {} as Partial<Record<AwardFieldKey, string>>,
        score: 0,
    };

    rows.slice(0, 10).forEach((cells, rowIndex) => {
        const columns: Partial<Record<AwardFieldKey, number>> = {};
        const labels: Partial<Record<AwardFieldKey, string>> = {};

        (cells ?? []).forEach((cell, columnIndex) => {
            const header = normalizeHeader(cell);

            if (!header) {
                return;
            }

            (Object.keys(ALIASES) as AwardFieldKey[]).forEach((field) => {
                if (columns[field] !== undefined || !ALIASES[field].includes(header)) {
                    return;
                }

                columns[field] = columnIndex;
                labels[field] = cellText(cell);
            });
        });

        const score = Object.keys(columns).length;

        if (score > best.score) {
            best = { headerRow: rowIndex, columns, labels, score };
        }
    });

    return { headerRow: best.headerRow, columns: best.columns, labels: best.labels };
}

/**
 * Read the first sheet of an Excel/CSV workbook into award rows.
 *
 * Parsing happens fully in the browser, matching the email/WhatsApp campaign
 * importers — the file itself is never uploaded.
 */
export async function extractAwardsFromWorkbook(
    file: File,
    maxRows: number,
): Promise<AwardImportResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName || !workbook.Sheets[sheetName]) {
        return EMPTY_RESULT;
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
        header: 1,
        raw: true,
        defval: '',
    });

    const { headerRow, columns, labels } = detectColumns(rows);

    if (headerRow === -1) {
        return { ...EMPTY_RESULT, missingColumns: REQUIRED_FIELDS };
    }

    const missingColumns = REQUIRED_FIELDS.filter((field) => columns[field] === undefined);

    if (missingColumns.length > 0) {
        return { ...EMPTY_RESULT, detected: labels, missingColumns };
    }

    const read = (cells: unknown[], field: AwardFieldKey): unknown => {
        const index = columns[field];

        return index === undefined ? '' : cells[index];
    };

    const parsed: AwardImportRow[] = [];
    let skippedMissingCodes = 0;
    let skippedInvalidDate = 0;

    rows.slice(headerRow + 1).forEach((cells) => {
        if (!Array.isArray(cells)) {
            return;
        }

        const personId = cellText(read(cells, 'person_id'));
        const awardId = cellText(read(cells, 'award_id'));

        if (personId === '' || awardId === '') {
            // Blank separator/total rows are expected at the bottom of sheets,
            // so an empty row is only counted when something else is present.
            if (cells.some((cell) => cellText(cell) !== '')) {
                skippedMissingCodes++;
            }

            return;
        }

        const awardedAt = parseAwardDate(read(cells, 'awarded_at'));

        if (!awardedAt) {
            skippedInvalidDate++;

            return;
        }

        parsed.push({
            person_id: personId,
            award_id: awardId,
            full_name: cellText(read(cells, 'full_name')),
            father_name: cellText(read(cells, 'father_name')),
            awarded_at: awardedAt,
        });
    });

    return {
        rows: parsed.slice(0, maxRows),
        detected: labels,
        missingColumns: [],
        skippedMissingCodes,
        skippedInvalidDate,
        skippedOverLimit: Math.max(0, parsed.length - maxRows),
    };
}

interface ExcelAwardsImportProps {
    maxRows: number;
    onExtract: (result: AwardImportResult) => void;
}

/**
 * File picker for the award import page. The parsed rows are handed back to the
 * page, which renders the preview and posts them to the server.
 */
export default function ExcelAwardsImport({ maxRows, onExtract }: ExcelAwardsImportProps) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hint = useMemo(() => t('dashboard.awards.import.hint'), [t]);

    const handleFile = async (file: File | undefined) => {
        if (!file) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            onExtract(await extractAwardsFromWorkbook(file, maxRows));
        } catch {
            setError(t('common.excelImport.readFailed'));
        } finally {
            setBusy(false);

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    return (
        <div className="rounded-xl border border-dashed p-4">
            <div className="flex flex-wrap items-center gap-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    disabled={busy}
                    onChange={(event) => handleFile(event.target.files?.[0])}
                    className="block w-full cursor-pointer text-sm file:me-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-blue-700 md:w-auto"
                />
                {busy && <span className="text-sm text-slate-500">{t('common.excelImport.reading')}</span>}
            </div>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
