/**
 * The dashboard's standard labelled form controls.
 *
 * Every field wraps a shadcn primitive in the same label + hint + error layout,
 * so create/edit screens stay visually aligned without repeating markup. The date
 * fields follow the browser-stored date-type preference (Afghan Solar Hijri by
 * default) and translate to the Gregorian `YYYY-MM-DD` string the server expects,
 * which keeps the stored values calendar-agnostic.
 *
 * Exports the individual `*Field` components plus the `FieldWrapper` shell.
 */
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDateType } from '@/hooks/use-date-type';
import { getDateTypeConfig } from '@/lib/date-type';
import { cn } from '@/lib/utils';
import { ComponentProps, ReactNode, useMemo, useState } from 'react';
import DateObject from 'react-date-object';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-multi-date-picker';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';

// Picker input/display format; the digits follow the selected calendar's locale.
const PICKER_FORMAT = 'YYYY/MM/DD';
const DATE_TIME_PICKER_FORMAT = 'YYYY/MM/DD HH:mm';

const toGregorianValue = (date?: DateObject | null): string => {
    if (!date) {
        return '';
    }

    return new DateObject(date)
        .convert(gregorian, gregorian_en)
        .format('YYYY-MM-DD');
};

/** Serialized form a datetime field submits, e.g. `2026-04-14T12:30`. */
const toGregorianDateTimeValue = (date?: DateObject | null): string => {
    if (!date) {
        return '';
    }

    return new DateObject(date)
        .convert(gregorian, gregorian_en)
        .format('YYYY-MM-DDTHH:mm');
};

/**
 * Parse a stored Gregorian string (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`) into a
 * DateObject projected onto the requested calendar.
 */
const fromGregorianValue = (
    value: string | null | undefined,
    calendar: typeof gregorian = gregorian,
    locale: typeof gregorian_en = gregorian_en,
): DateObject | null => {
    if (!value) {
        return null;
    }

    return new DateObject({
        date: value,
        calendar: gregorian,
        locale: gregorian_en,
    }).convert(calendar, locale);
};

interface FieldWrapperProps {
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
    className?: string;
}

function FieldWrapper({
    label,
    hint,
    error,
    children,
    className,
}: FieldWrapperProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Label>{label}</Label>
            {children}
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
            {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

interface TextFieldProps extends ComponentProps<typeof Input> {
    label: string;
    error?: string;
    hint?: string;
}

function TextField({
    label,
    error,
    hint,
    className,
    ...props
}: TextFieldProps) {
    return (
        <FieldWrapper label={label} error={error} hint={hint}>
            <Input className={className} {...props} />
        </FieldWrapper>
    );
}

interface TextAreaFieldProps extends ComponentProps<typeof Textarea> {
    label: string;
    error?: string;
    hint?: string;
}

function TextAreaField({
    label,
    error,
    hint,
    className,
    ...props
}: TextAreaFieldProps) {
    return (
        <FieldWrapper label={label} error={error} hint={hint}>
            <Textarea className={className} {...props} />
        </FieldWrapper>
    );
}

interface SelectOption {
    value: string;
    label?: string;
    /** Optional i18n key; when present the label is translated with `label` as fallback. */
    labelKey?: string;
}

interface SelectFieldProps {
    label: string;
    name: string;
    options: SelectOption[];
    defaultValue?: string;
    error?: string;
    hint?: string;
    className?: string;
    required?: boolean;
    placeholder?: string;
    onChange?: (value: string) => void;
}

// Radix reserves an empty string for the placeholder, so a real "none" option
// (e.g. "No category") is mapped to this sentinel and translated back for the
// native input that Inertia submits by name.
const SELECT_NONE_SENTINEL = '__none__';

function SelectField({
    label,
    name,
    options,
    defaultValue = '',
    error,
    hint,
    className,
    required,
    placeholder,
    onChange,
}: SelectFieldProps) {
    const { t } = useTranslation();
    const [value, setValue] = useState<string>(
        defaultValue === '' ? '' : defaultValue,
    );

    const hiddenValue = value === SELECT_NONE_SENTINEL ? '' : value;

    return (
        <FieldWrapper
            label={label}
            error={error}
            hint={hint}
            className={className}
        >
            <Select
                value={value}
                onValueChange={(next) => {
                    setValue(next);
                    onChange?.(next === SELECT_NONE_SENTINEL ? '' : next);
                }}
            >
                <SelectTrigger id={name}>
                    <SelectValue
                        placeholder={
                            placeholder ?? t('dashboard.form.selectPlaceholder')
                        }
                    />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => {
                        const itemValue =
                            option.value === ''
                                ? SELECT_NONE_SENTINEL
                                : option.value;
                        return (
                            <SelectItem key={itemValue} value={itemValue}>
                                {t(
                                    option.labelKey ??
                                        option.label ??
                                        option.value,
                                )}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
            <input
                type="hidden"
                name={name}
                value={hiddenValue}
                required={required}
            />
        </FieldWrapper>
    );
}

interface CheckboxFieldProps
    extends Omit<ComponentProps<typeof Checkbox>, 'children'> {
    label: string;
    error?: string;
    hint?: string;
}

function CheckboxField({
    label,
    error,
    hint,
    className,
    ...props
}: CheckboxFieldProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            <label className="flex items-center gap-2 text-sm">
                <Checkbox {...props} />
                <span>{label}</span>
            </label>
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
            {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

interface DateFieldProps {
    label: string;
    name: string;
    value?: string | null;
    defaultValue?: string | null;
    error?: string;
    hint?: string;
    required?: boolean;
    className?: string;
    onValueChange?: (value: string) => void;
}

/**
 * Calendar-aware date (optionally date-time) picker driven by the shared
 * date-type preference. The visible value follows the selected calendar; the
 * submitted hidden input always carries the calendar-agnostic Gregorian value.
 */
function CalendarField({
    label,
    name,
    withTime = false,
    value,
    defaultValue,
    error,
    hint,
    required,
    className,
    onValueChange,
}: DateFieldProps & { withTime?: boolean }) {
    const { dateType } = useDateType();
    const { i18n } = useTranslation();
    const { calendar, locale } = getDateTypeConfig(dateType, i18n.language);

    const [selected, setSelected] = useState<DateObject | null>(
        fromGregorianValue(value ?? defaultValue ?? null, calendar, locale),
    );

    // Keep the picker in sync when the controlled value, the stored preference
    // or the UI language change, adjusting state during render (instead of an
    // effect) per React's derived-state guidance. Uncontrolled fields re-project
    // their current selection onto the new calendar instead of re-reading props.
    const [syncKey, setSyncKey] = useState({
        value,
        dateType,
        language: i18n.language,
    });
    if (
        syncKey.value !== value ||
        syncKey.dateType !== dateType ||
        syncKey.language !== i18n.language
    ) {
        setSyncKey({ value, dateType, language: i18n.language });

        if (value !== undefined) {
            setSelected(fromGregorianValue(value, calendar, locale));
        } else {
            setSelected((prev) =>
                prev ? new DateObject(prev).convert(calendar, locale) : prev,
            );
        }
    }

    const submittedValue = useMemo(
        () =>
            withTime
                ? toGregorianDateTimeValue(selected)
                : toGregorianValue(selected),
        [selected, withTime],
    );

    return (
        <FieldWrapper
            label={label}
            error={error}
            hint={hint}
            className={className}
        >
            <div className="space-y-2">
                <DatePicker
                    value={selected}
                    onChange={(nextValue) => {
                        const normalized = Array.isArray(nextValue)
                            ? (nextValue[0] ?? null)
                            : nextValue;
                        setSelected(normalized ?? null);
                        onValueChange?.(
                            withTime
                                ? toGregorianDateTimeValue(normalized ?? null)
                                : toGregorianValue(normalized ?? null),
                        );
                    }}
                    calendar={calendar}
                    locale={locale}
                    format={withTime ? DATE_TIME_PICKER_FORMAT : PICKER_FORMAT}
                    placeholder={
                        withTime ? DATE_TIME_PICKER_FORMAT : PICKER_FORMAT
                    }
                    plugins={
                        withTime
                            ? [
                                  <TimePicker
                                      key="time-picker"
                                      position="bottom"
                                      hideSeconds
                                  />,
                              ]
                            : []
                    }
                    className="w-full"
                    inputClass="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    containerClassName="w-full"
                />
                <input
                    type="hidden"
                    name={name}
                    value={submittedValue}
                    required={required}
                />
            </div>
        </FieldWrapper>
    );
}

function DateField(props: DateFieldProps) {
    return <CalendarField {...props} />;
}

/** Date + time variant; submits `YYYY-MM-DDTHH:mm`, the datetime-local shape. */
function DateTimeField(props: DateFieldProps) {
    return <CalendarField {...props} withTime />;
}

export {
    CheckboxField,
    DateField,
    DateTimeField,
    FieldWrapper,
    SelectField,
    TextAreaField,
    TextField,
};
