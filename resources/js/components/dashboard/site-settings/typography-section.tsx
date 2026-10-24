import ConfirmDialog from '@/components/form/confirm-dialog';
import type {
    FontFamilyRecord,
    GoogleFontRecord,
    LanguageTypographyRecord,
    SiteSettingsPageProps,
} from '@/components/dashboard/site-settings/site-settings-shared';
import { Button } from '@/components/ui/button';
import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface TypographySectionProps {
    /** Only the active settings tab paints; the panel stays mounted otherwise. */
    active: boolean;
}

// One line per authored language so the preview shows real script and shaping.
const SAMPLE_TEXT: Record<string, string> = {
    en: 'The quick brown fox jumps over 13 lazy dogs.',
    ps: 'ژبه د پوهې کليده ده او زده کړه د پرمختګ بنسټ دی.',
    fa_AF: 'زبان کلید دانش است و آموزش بنیاد پیشرفت.',
    ar: 'اللغة مفتاح المعرفة والتعليم أساس التقدم.',
};

const WEIGHTS = [400, 500, 600, 700] as const;

const sampleFor = (code: string): string =>
    SAMPLE_TEXT[code] ?? 'Aa Bb Cc 123 — ۱۲۳ نمونه';

const fieldClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

/**
 * The stored selection is a single opaque value so a language can only ever have
 * one typeface source: `default`, `google:{key}` or `font:{uploadedId}`.
 */
const selectionFor = (language: LanguageTypographyRecord): string => {
    if (language.google_font) {
        return `google:${language.google_font}`;
    }

    if (language.font_family_id != null) {
        return `font:${language.font_family_id}`;
    }

    return 'default';
};

/**
 * Per-language typefaces. The choice is stored on the language row and applied
 * site-wide (public pages and dashboard) by the server-rendered
 * `--app-font-active` variable, so this panel only manages the data.
 */
export default function TypographySection({ active }: TypographySectionProps) {
    const { fonts, typography, googleFonts, googleFontsHref } = usePage<SiteSettingsPageProps>().props;
    const { t } = useTranslation();

    const form = useForm<{
        name: string;
        files: Record<string, File | null>;
    }>({
        name: '',
        files: { 400: null, 500: null, 600: null, 700: null },
    });

    // Uploaded families need @font-face rules in this document; Google families
    // come from one combined stylesheet. Neither is shipped with the public page
    // for languages that do not use it.
    useEffect(() => {
        const rules = fonts
            .flatMap((font) =>
                font.files.map(
                    (file) =>
                        `@font-face{font-family:'${font.family}';font-style:${file.style};font-weight:${file.weight};font-display:swap;src:url('${file.url}') format('${file.format}')}`,
                ),
            )
            .join('');

        const faceStyle = document.createElement('style');
        faceStyle.id = 'dashboard-font-faces';
        faceStyle.textContent = rules;
        document.head.appendChild(faceStyle);

        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://fonts.googleapis.com';

        const stylesheet = document.createElement('link');
        stylesheet.id = 'dashboard-google-fonts';
        stylesheet.rel = 'stylesheet';
        stylesheet.href = googleFontsHref;
        document.head.append(preconnect, stylesheet);

        return () => {
            faceStyle.remove();
            preconnect.remove();
            stylesheet.remove();
        };
    }, [fonts, googleFontsHref]);

    const googleByKey = useMemo(
        () => new Map(googleFonts.map((font) => [font.key, font])),
        [googleFonts],
    );

    const stackFor = (selection: string): string | null => {
        if (selection.startsWith('google:')) {
            return googleByKey.get(selection.slice('google:'.length))?.stack ?? null;
        }

        if (selection.startsWith('font:')) {
            const id = Number(selection.slice('font:'.length));

            return fonts.find((font) => font.id === id)?.stack ?? null;
        }

        return null;
    };

    const submitUpload = () => {
        form.post('/dashboard/typography/fonts', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const assignFont = (languageId: number, selection: string) => {
        router.put(
            `/dashboard/typography/languages/${languageId}`,
            { selection },
            { preserveScroll: true },
        );
    };

    const removeFont = (font: FontFamilyRecord) => {
        router.delete(`/dashboard/typography/fonts/${font.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <section
            hidden={!active}
            className="mt-4 scroll-mt-24 rounded-xl border border-border bg-card p-4"
        >
            <header className="mb-4 border-b border-border pb-3">
                <h2 className="text-lg font-semibold">
                    {t('dashboard.settings.typography.title')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t('dashboard.settings.typography.description')}
                </p>
            </header>

            <div className="space-y-3">
                {typography.map((language) => {
                    const selection = selectionFor(language);
                    const stack = stackFor(selection);
                    const google =
                        language.google_font != null
                            ? googleByKey.get(language.google_font)
                            : undefined;
                    const missingArabic = google !== undefined && !google.arabic;

                    return (
                        <div
                            key={language.id}
                            className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-start"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <span>{language.name}</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal uppercase dark:bg-slate-800">
                                        {language.code}
                                    </span>
                                    {!language.is_active ? (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                            {t('dashboard.settings.typography.inactive')}
                                        </span>
                                    ) : null}
                                </div>
                                <select
                                    value={selection}
                                    onChange={(event) =>
                                        assignFont(language.id, event.target.value)
                                    }
                                    className={fieldClass}
                                    aria-label={t(
                                        'dashboard.settings.typography.fontFor',
                                        { language: language.name },
                                    )}
                                >
                                    <optgroup
                                        label={t(
                                            'dashboard.settings.typography.groupDefault',
                                        )}
                                    >
                                        <option value="default">
                                            {t('dashboard.settings.typography.defaultFont')}
                                        </option>
                                    </optgroup>
                                    <optgroup
                                        label={t(
                                            'dashboard.settings.typography.groupGoogleArabic',
                                        )}
                                    >
                                        {googleFonts
                                            .filter((font) => font.arabic)
                                            .map((font) => (
                                                <option
                                                    key={font.key}
                                                    value={`google:${font.key}`}
                                                >
                                                    {font.name}
                                                </option>
                                            ))}
                                    </optgroup>
                                    <optgroup
                                        label={t(
                                            'dashboard.settings.typography.groupGoogleLatin',
                                        )}
                                    >
                                        {googleFonts
                                            .filter((font) => !font.arabic)
                                            .map((font) => (
                                                <option
                                                    key={font.key}
                                                    value={`google:${font.key}`}
                                                >
                                                    {font.name}
                                                </option>
                                            ))}
                                    </optgroup>
                                    {fonts.length > 0 ? (
                                        <optgroup
                                            label={t(
                                                'dashboard.settings.typography.groupUploaded',
                                            )}
                                        >
                                            {fonts.map((font) => (
                                                <option
                                                    key={font.id}
                                                    value={`font:${font.id}`}
                                                >
                                                    {font.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ) : null}
                                </select>

                                {missingArabic && language.dir === 'rtl' ? (
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        {t(
                                            'dashboard.settings.typography.rtlFallback',
                                        )}
                                    </p>
                                ) : null}
                            </div>

                            <div
                                dir={language.dir}
                                className="rounded-lg border border-dashed border-border px-3 py-2 text-base leading-relaxed"
                                style={stack ? { fontFamily: stack } : undefined}
                            >
                                {sampleFor(language.code)}
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    {stack && selection !== 'default'
                                        ? t(
                                              'dashboard.settings.typography.previewOf',
                                              {
                                                  family:
                                                      google?.name ??
                                                      fonts.find(
                                                          (font) =>
                                                              `font:${font.id}` === selection,
                                                      )?.name ??
                                                      '',
                                              },
                                          )
                                        : t('dashboard.settings.typography.previewDefault')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 border-t border-border pt-4">
                <h3 className="text-sm font-semibold">
                    {t('dashboard.settings.typography.googleTitle')}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    {t('dashboard.settings.typography.googleHint')}
                </p>

                {[
                    {
                        key: 'arabic',
                        titleKey: 'dashboard.settings.typography.googleArabicTitle',
                        items: googleFonts.filter((font) => font.arabic),
                    },
                    {
                        key: 'latin',
                        titleKey: 'dashboard.settings.typography.googleLatinTitle',
                        items: googleFonts.filter((font) => !font.arabic),
                    },
                ].map((group) => (
                    <div key={group.key} className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground">
                            {t(group.titleKey)}
                        </p>
                        <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {group.items.map((font: GoogleFontRecord) => (
                                <li
                                    key={font.key}
                                    className="rounded-lg border border-border bg-background p-3"
                                >
                                    <span
                                        className="block truncate text-base"
                                        style={{ fontFamily: font.stack }}
                                    >
                                        {font.name}
                                    </span>
                                    <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span
                                            className={
                                                font.arabic
                                                    ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                                    : 'rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800'
                                            }
                                        >
                                            {font.arabic
                                                ? t(
                                                      'dashboard.settings.typography.arabicSupport',
                                                  )
                                                : t(
                                                      'dashboard.settings.typography.latinOnly',
                                                  )}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <p className="mt-2 text-xs text-muted-foreground">
                    {t('dashboard.settings.typography.googleNetwork')}
                </p>
            </div>

            <div className="mt-5 border-t border-border pt-4">
                <h3 className="text-sm font-semibold">
                    {t('dashboard.settings.typography.library')}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    {t('dashboard.settings.typography.libraryHint')}
                </p>

                {fonts.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                        {fonts.map((font) => (
                            <li
                                key={font.id}
                                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3"
                            >
                                <span
                                    className="text-base font-medium"
                                    style={{ fontFamily: font.stack }}
                                >
                                    {font.name}
                                </span>
                                <span className="flex flex-wrap gap-1 text-xs">
                                    {font.files.map((file) => (
                                        <span
                                            key={`${file.weight}-${file.style}`}
                                            className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800"
                                        >
                                            {file.weight}
                                        </span>
                                    ))}
                                </span>
                                {font.languages.length > 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                        {t(
                                            'dashboard.settings.typography.usedBy',
                                            { languages: font.languages.join(', ') },
                                        )}
                                    </span>
                                ) : null}
                                <span className="ms-auto">
                                    <ConfirmDialog
                                        title={t(
                                            'dashboard.settings.typography.deleteTitle',
                                            { name: font.name },
                                        )}
                                        description={t(
                                            'dashboard.settings.typography.deleteDescription',
                                        )}
                                        confirmLabel={t('dashboard.form.delete')}
                                        onConfirm={() => removeFont(font)}
                                    >
                                        <Button type="button" variant="destructive" size="sm">
                                            {t('dashboard.settings.typography.delete')}
                                        </Button>
                                    </ConfirmDialog>
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                        {t('dashboard.settings.typography.empty')}
                    </p>
                )}

                <details className="mt-4 rounded-lg border border-dashed border-border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                        {t('dashboard.settings.typography.upload')}
                    </summary>
                    <p className="mt-2 text-xs text-muted-foreground">
                        {t('dashboard.settings.typography.uploadHint')}
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-sm">
                            <span className="font-medium">
                                {t('dashboard.settings.typography.familyName')}
                            </span>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder={t(
                                    'dashboard.settings.typography.familyNamePlaceholder',
                                )}
                                className={fieldClass}
                            />
                            {form.errors.name ? (
                                <span className="text-xs text-red-600 dark:text-red-400">
                                    {form.errors.name}
                                </span>
                            ) : null}
                        </label>

                        {WEIGHTS.map((weight) => (
                            <label key={weight} className="grid gap-1 text-sm">
                                <span className="font-medium">
                                    {t('dashboard.settings.typography.weightFile', {
                                        weight,
                                    })}
                                </span>
                                <input
                                    type="file"
                                    accept=".woff2,.woff,.ttf,.otf"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        form.setData('files', {
                                            ...form.data.files,
                                            [String(weight)]: file,
                                        });
                                    }}
                                    className="block w-full cursor-pointer text-xs file:me-2 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-blue-700"
                                />
                                {form.errors[`files.${weight}`] ? (
                                    <span className="text-xs text-red-600 dark:text-red-400">
                                        {form.errors[`files.${weight}`]}
                                    </span>
                                ) : null}
                            </label>
                        ))}
                    </div>

                    {form.errors.files ? (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            {form.errors.files}
                        </p>
                    ) : null}

                    <div className="mt-3">
                        <Button
                            type="button"
                            onClick={submitUpload}
                            disabled={form.processing}
                            size="sm"
                        >
                            {form.processing
                                ? t('dashboard.settings.typography.uploading')
                                : t('dashboard.settings.typography.uploadButton')}
                        </Button>
                    </div>
                </details>
            </div>
        </section>
    );
}
