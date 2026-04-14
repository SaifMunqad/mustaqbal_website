import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import DateObject from 'react-date-object';
import gregorian from 'react-date-object/calendars/gregorian';
import arabic from 'react-date-object/calendars/arabic';
import persian from 'react-date-object/calendars/persian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import arabic_ar from 'react-date-object/locales/arabic_ar';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker from 'react-multi-date-picker';
import { ComponentProps, ReactNode, useEffect, useMemo, useState } from 'react';

type CalendarKind = 'persian' | 'islamic';

const calendarConfig: Record<CalendarKind, { calendar: typeof persian; locale: typeof persian_fa; placeholder: string }> = {
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

    return new DateObject(date).convert(gregorian, gregorian_en).format('YYYY-MM-DD');
};

const fromGregorianValue = (value?: string | null, calendarKind: CalendarKind = 'persian'): DateObject | null => {
    if (!value) {
        return null;
    }

    return new DateObject({ date: value, calendar: gregorian, locale: gregorian_en }).convert(
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

function FieldWrapper({ label, hint, error, children, className }: FieldWrapperProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Label>{label}</Label>
            {children}
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        </div>
    );
}

interface TextFieldProps extends ComponentProps<typeof Input> {
    label: string;
    error?: string;
    hint?: string;
}

function TextField({ label, error, hint, className, ...props }: TextFieldProps) {
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

function TextAreaField({ label, error, hint, className, ...props }: TextAreaFieldProps) {
    return (
        <FieldWrapper label={label} error={error} hint={hint}>
            <Textarea className={className} {...props} />
        </FieldWrapper>
    );
}

interface SelectFieldProps extends ComponentProps<'select'> {
    label: string;
    error?: string;
    hint?: string;
}

function SelectField({ label, error, hint, className, ...props }: SelectFieldProps) {
    return (
        <FieldWrapper label={label} error={error} hint={hint}>
            <select
                className={cn(
                    'border-input focus-visible:ring-ring rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none',
                    className,
                )}
                {...props}
            />
        </FieldWrapper>
    );
}

interface CheckboxFieldProps extends Omit<ComponentProps<'input'>, 'type'> {
    label: string;
    error?: string;
    hint?: string;
}

function CheckboxField({ label, error, hint, className, ...props }: CheckboxFieldProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 rounded border-border" {...props} />
                <span>{label}</span>
            </label>
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
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

    useEffect(() => {
        if (value !== undefined) {
            setSelected(fromGregorianValue(value, calendar));
        }
    }, [calendar, value]);

    const config = calendarConfig[calendar];
    const gregorianValue = useMemo(() => toGregorianValue(selected), [selected]);

    return (
        <FieldWrapper label={label} error={error} hint={hint} className={className}>
            <div className="space-y-2">
                <DatePicker
                    value={selected}
                    onChange={(nextValue) => {
                        const normalized = Array.isArray(nextValue) ? nextValue[0] ?? null : nextValue;
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
                <input type="hidden" name={name} value={gregorianValue} required={required} />
            </div>
        </FieldWrapper>
    );
}

export { CheckboxField, DateField, FieldWrapper, SelectField, TextAreaField, TextField };


