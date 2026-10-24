/**
 * Excel/CSV drop target for bulk email campaigns.
 *
 * Parsing is exported separately as `extractEmailsFromWorkbook` and runs fully in
 * the browser — the file never leaves the client. When a header cell matches
 * "email" only that column is read, otherwise every cell is scanned; results are
 * deduplicated and invalid tokens counted so the UI can report the outcome.
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

export interface ExtractedEmails {
    /** Valid, deduplicated, lowercased email addresses. */
    emails: string[];
    /** Tokens that looked like emails but failed validation. */
    invalid: number;
    /** Duplicate addresses removed from the result. */
    duplicates: number;
    /** Header label of the detected email column, when one was found. */
    column: string | null;
}

const EMAIL_RE = /^[^\s@,;:<>]+@[^\s@,;:<>]+(?:\.[^\s@,;:<>]+)+$/;

const EMPTY_RESULT: ExtractedEmails = { emails: [], invalid: 0, duplicates: 0, column: null };

/**
 * Reads the first sheet of an Excel/CSV workbook and extracts email addresses.
 *
 * When a header cell matching "email"/"e-mail" exists, only that column is
 * read; otherwise every cell in the sheet is scanned. Cells may hold several
 * addresses separated by commas, spaces, or newlines. Parsing happens fully
 * on the frontend — the file never touches the server.
 */
export async function extractEmailsFromWorkbook(file: File): Promise<ExtractedEmails> {
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

    // Find the email column in (roughly) the first rows of the sheet.
    let emailColumn = -1;
    let headerRow = -1;
    let columnLabel: string | null = null;

    for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const cells = rows[r] ?? [];
        const index = cells.findIndex(
            (cell) => typeof cell === 'string' && /e[-\s_]?mail/i.test(cell.trim()),
        );

        if (index !== -1) {
            emailColumn = index;
            headerRow = r;
            columnLabel = String(cells[index]).trim();
            break;
        }
    }

    const candidates: string[] = [];

    if (emailColumn !== -1) {
        for (let r = headerRow + 1; r < rows.length; r++) {
            const cell = rows[r]?.[emailColumn];
            const text = cell === undefined || cell === null ? '' : String(cell).trim();

            if (text !== '') {
                candidates.push(text);
            }
        }
    } else {
        // No header found: fall back to scanning every cell.
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
    const emails: string[] = [];
    let invalid = 0;
    let duplicates = 0;

    candidates.forEach((candidate) => {
        candidate
            .split(/[\s,;]+/)
            .map((token) => token.trim())
            .filter((token) => token !== '')
            .forEach((token) => {
                if (EMAIL_RE.test(token)) {
                    const lower = token.toLowerCase();

                    if (seen.has(lower)) {
                        duplicates += 1;
                    } else {
                        seen.add(lower);
                        emails.push(lower);
                    }
                } else if (token.includes('@')) {
                    invalid += 1;
                }
            });
    });

    return { emails, invalid, duplicates, column: columnLabel };
}

interface ExcelEmailsImportProps {
    onExtract: (result: ExtractedEmails) => void;
}

export default function ExcelEmailsImport({ onExtract }: ExcelEmailsImportProps) {
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
            onExtract(await extractEmailsFromWorkbook(file));
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
                {busy && (
                    <span className="text-sm text-slate-500">
                        {t('common.excelImport.reading')}
                    </span>
                )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
                {t('common.excelImport.emailsHint')}
            </p>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
