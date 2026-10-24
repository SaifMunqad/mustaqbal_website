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
import { cn } from '@/lib/utils';
import { ComponentProps, ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DateObject from 'react-date-object';
import arabic from 'react-date-object/calendars/arabic';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import arabic_ar from 'react-date-object/locales/arabic_ar';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker from 'react-multi-date-picker';

type CalendarKind = 'persian' | 'islamic';

const calendarConfig: Record<
    CalendarKind,
    { calendar: typeof persian; locale: typeof persian_fa; placeholder: string }
> = {
    persian: {
        calendar: persian,
        locale: persian_fa,
        placeholder: 'YYYY/MM/DD',
    },
    islamic: {
        calendar: arabic,
        locale: arabic_ar,
        placeholder: 'YYYY/MM/DD',
    },
};

const toGregorianValue = (date?: DateObject | null): string => {
    if (!date) {
        return '';
    }

    return new DateObject(date)
        .convert(gregorian, gregorian_en)
        .format('YYYY-MM-DD');
};

const fromGregorianValue = (
    value?: string | null,
    calendarKind: CalendarKind = 'persian',
): DateObject | null => {
    if (!value) {
        return null;
    }

    return new DateObject({
        date: value,
        calendar: gregorian,
        locale: gregorian_en,
    }).convert(
        calendarConfig[calendarKind].calendar,
        calendarConfig[calendarKind].locale,
    );
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
                            placeholder ??
                            t('dashboard.form.selectPlaceholder')
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
    calendar?: CalendarKind;
    value?: string | null;
    defaultValue?: string | null;
    error?: string;
    hint?: string;
    required?: boolean;
    className?: string;
    onValueChange?: (value: string) => void;
}

function DateField({
    label,
    name,
    calendar = 'persian',
    value,
    defaultValue,
    error,
    hint,
    required,
    className,
    onValueChange,
}: DateFieldProps) {
    const [selected, setSelected] = useState<DateObject | null>(
        fromGregorianValue(value ?? defaultValue ?? null, calendar),
    );

    // Keep the picker in sync when the controlled value or calendar changes,
    // adjusting state during render (instead of an effect) per React's
    // derived-state guidance. Only controlled values (value !== undefined)
    // re-sync, matching the previous effect behaviour.
    const [syncKey, setSyncKey] = useState({ value, calendar });
    if (syncKey.value !== value || syncKey.calendar !== calendar) {
        setSyncKey({ value, calendar });
        if (value !== undefined) {
            setSelected(fromGregorianValue(value, calendar));
        }
    }

    const config = calendarConfig[calendar];
    const gregorianValue = useMemo(
        () => toGregorianValue(selected),
        [selected],
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
                        onValueChange?.(toGregorianValue(normalized ?? null));
                    }}
                    calendar={config.calendar}
                    locale={config.locale}
                    format={config.placeholder}
                    placeholder={config.placeholder}
                    className="w-full"
                    inputClass="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    containerClassName="w-full"
                />
                <input
                    type="hidden"
                    name={name}
                    value={gregorianValue}
                    required={required}
                />
            </div>
        </FieldWrapper>
    );
}

export {
    CheckboxField,
    DateField,
    FieldWrapper,
    SelectField,
    TextAreaField,
    TextField,
};
