/**
 * Excel/CSV drop target for WhatsApp campaigns.
 *
 * `extractPhonesFromWorkbook` normalises each candidate to the E.164 range
 * (digits with at most one leading `+`), then deduplicates and reports invalid
 * and duplicate counts. Like the email importer it parses entirely client-side.
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

export interface ExtractedPhones {
    /** Valid, deduplicated phone numbers (digits, optional leading +). */
    phones: string[];
    /** Tokens that looked like phone numbers but failed validation. */
    invalid: number;
    /** Duplicate numbers removed from the result. */
    duplicates: number;
    /** Header label of the detected phone column, when one was found. */
    column: string | null;
}

const EMPTY_RESULT: ExtractedPhones = { phones: [], invalid: 0, duplicates: 0, column: null };

/**
 * Keep the characters a WhatsApp number may legitimately contain (digits and a
 * single leading +), then accept anything in the 7–15 digit E.164 range.
 */
function normalizePhone(raw: string): string | null {
    const trimmed = raw.trim();

    if (trimmed === '') {
        return null;
    }

    const plus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D+/g, '');

    if (digits.length < 7 || digits.length > 15) {
        return null;
    }

    return plus ? `+${digits}` : digits;
}

/**
 * Reads the first sheet of an Excel/CSV workbook and extracts phone numbers.
 *
 * When a header cell matching "phone"/"mobile"/"whatsapp"/"number"/"tel" exists,
 * only that column is read; otherwise every cell is scanned. Parsing happens fully
 * on the frontend — the file never touches the server.
 */
export async function extractPhonesFromWorkbook(file: File): Promise<ExtractedPhones> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName || !workbook.Sheets[sheetName]) {
        return EMPTY_RESULT;
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
        header: 1,
        raw: false,
        defval: '',
    });

    let phoneColumn = -1;
    let headerRow = -1;
    let columnLabel: string | null = null;

    for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const cells = rows[r] ?? [];
        const index = cells.findIndex(
            (cell) => typeof cell === 'string' && /(phone|mobile|whatsapp|tel|number)/i.test(cell.trim()),
        );

        if (index !== -1) {
            phoneColumn = index;
            headerRow = r;
            columnLabel = String(cells[index]).trim();
            break;
        }
    }

    const candidates: string[] = [];

    if (phoneColumn !== -1) {
        for (let r = headerRow + 1; r < rows.length; r++) {
            const cell = rows[r]?.[phoneColumn];
            const text = cell === undefined || cell === null ? '' : String(cell).trim();

            if (text !== '') {
                candidates.push(text);
            }
        }
    } else {
        rows.forEach((cells) =>
            cells.forEach((cell) => {
                const text = cell === undefined || cell === null ? '' : String(cell).trim();

                if (text !== '') {
                    candidates.push(text);
                }
            }),
        );
    }

    const seen = new Set<string>();
    const phones: string[] = [];
    let invalid = 0;
    let duplicates = 0;

    candidates.forEach((candidate) => {
        candidate
            .split(/[\s,;]+/)
            .map((token) => token.trim())
            .filter((token) => token !== '')
            .forEach((token) => {
                const normalized = normalizePhone(token);

                if (normalized !== null) {
                    if (seen.has(normalized)) {
                        duplicates += 1;
                    } else {
                        seen.add(normalized);
                        phones.push(normalized);
                    }
                } else if (/\d/.test(token)) {
                    invalid += 1;
                }
            });
    });

    return { phones, invalid, duplicates, column: columnLabel };
}

interface ExcelPhonesImportProps {
    onExtract: (result: ExtractedPhones) => void;
}

export default function ExcelPhonesImport({ onExtract }: ExcelPhonesImportProps) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = async (file: File | undefined) => {
        if (!file) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            onExtract(await extractPhonesFromWorkbook(file));
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
                    className="block w-full cursor-pointer text-sm file:me-3 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-green-700 md:w-auto"
                />
                {busy && (
                    <span className="text-sm text-slate-500">
                        {t('common.excelImport.reading')}
                    </span>
                )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
                {t('common.excelImport.phonesHint')}
            </p>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
