'use client';

import type { AnyFieldApi } from '@tanstack/react-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

function errorText(field: AnyFieldApi) {
  const errors = field.state.meta.errors as unknown[];
  const first = errors.find(Boolean);
  if (!first) return null;
  return typeof first === 'string' ? first : ((first as { message?: string }).message ?? null);
}

function FieldShell({
  field,
  label,
  required,
  className,
  children
}: {
  field: AnyFieldApi;
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const error =
    field.state.meta.isTouched || field.form.state.isSubmitted ? errorText(field) : null;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={field.name} className='text-sm font-medium'>
        {label}
        {required && <sup className='text-destructive ml-0.5'>*</sup>}
      </Label>
      {children}
      {error && (
        <p id={`${field.name}-error`} className='text-destructive text-sm'>
          {error}
        </p>
      )}
    </div>
  );
}

/** Text/number/password input with an optional suffix addon (%, °C, lux), like Filament's TextInput. */
export function FormInput({
  field,
  label,
  required,
  suffix,
  type = 'text',
  disabled,
  placeholder,
  autoComplete,
  className
}: {
  field: AnyFieldApi;
  label: string;
  required?: boolean;
  suffix?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}) {
  const invalid = field.state.meta.isTouched && !!errorText(field);
  const input = (
    <Input
      id={field.name}
      name={field.name}
      type={type}
      step={type === 'number' ? 'any' : undefined}
      value={field.state.value ?? ''}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-invalid={invalid}
      aria-describedby={invalid ? `${field.name}-error` : undefined}
      onBlur={field.handleBlur}
      onChange={(e) =>
        field.handleChange(
          type === 'number'
            ? e.target.value === ''
              ? undefined
              : Number(e.target.value)
            : e.target.value
        )
      }
      className={suffix ? 'rounded-r-none' : undefined}
    />
  );

  return (
    <FieldShell field={field} label={label} required={required} className={className}>
      {suffix ? (
        <div className='flex'>
          {input}
          <span className='text-muted-foreground bg-muted/40 flex items-center rounded-r-lg border border-l-0 px-3 text-sm'>
            {suffix}
          </span>
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
}

export function FormSelect({
  field,
  label,
  required,
  options,
  disabled,
  placeholder = 'Select an option',
  className
}: {
  field: AnyFieldApi;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FieldShell field={field} label={label} required={required} className={className}>
      <Select
        name={field.name}
        value={field.state.value || null}
        disabled={disabled}
        onValueChange={(value) => field.handleChange(value ?? '')}
      >
        <SelectTrigger id={field.name} className='w-full'>
          <SelectValue placeholder={placeholder}>
            {(value: string | null) => options.find((o) => o.value === value)?.label ?? placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

/** A disabled, non-form display of a value (e.g. the device id, or a plant's device). */
export function ReadOnlyInput({
  label,
  value,
  className
}: {
  label: string;
  value: string;
  className?: string;
}) {
  const id = `readonly-${label.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className='text-sm font-medium'>
        {label}
      </Label>
      <Input id={id} value={value} disabled readOnly />
    </div>
  );
}
