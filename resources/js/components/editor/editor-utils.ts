export const CHART_TYPES = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' },
    { value: 'pie', label: 'Pie' },
    { value: 'doughnut', label: 'Doughnut' },
];

export interface ChartDraft {
    type: string;
    title: string;
    labels: string;
    values: string;
}

/** Convert a data: URI produced by Mammoth into a File for upload. */
export function dataUriToFile(dataUri: string, fallbackName: string): File | null {
    const match = /^data:(?<mime>[^;]+);base64,(?<b64>.*)$/.exec(dataUri);
    if (!match?.groups) return null;
    try {
        const binary = atob(match.groups.b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: match.groups.mime });
        const ext = match.groups.mime.split('/')[1] ?? 'png';
        return new File([blob], fallbackName || `image.${ext}`, {
            type: match.groups.mime,
        });
    } catch {
        return null;
    }
}
