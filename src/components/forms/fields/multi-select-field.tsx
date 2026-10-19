'use client';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor
} from '@/components/ui/combobox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

type Option = { value: string; label: string; disabled?: boolean };

/**
 * Searchable multi-select over a `string[]` value: pick from the dropdown, selected options show
 * as removable chips. Use with `mode='array'` on the `<form.AppField>`:
 *
 * ```tsx
 * <form.AppField name='roleIds' mode='array'
 *   children={(field) => <field.MultiSelectField label='Roles' options={…} />} />
 * ```
 */
export function MultiSelectField({
  label,
  description,
  required,
  options,
  placeholder = 'Select…',
  emptyMessage = 'No results found.'
}: BaseFieldProps & {
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
}) {
  const field = useFieldContext<string[]>();
  const isInvalid = useFieldInvalid();
  const anchor = useComboboxAnchor();
  const values = field.state.value ?? [];
  // The combobox works with the option objects; the form stores just their values.
  const selected = options.filter((o) => values.includes(o.value));

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <Combobox
        multiple
        items={options}
        value={selected}
        onValueChange={(next: Option[]) => field.handleChange(next.map((o) => o.value))}
        isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
        itemToStringLabel={(o: Option) => o.label}
        itemToStringValue={(o: Option) => o.value}
      >
        <ComboboxChips ref={anchor} onBlur={field.handleBlur}>
          <ComboboxValue>
            {(chips: Option[]) => (
              <>
                {chips.map((o) => (
                  <ComboboxChip key={o.value}>{o.label}</ComboboxChip>
                ))}
                <ComboboxChipsInput
                  id={field.name}
                  placeholder={chips.length === 0 ? placeholder : ''}
                  aria-invalid={isInvalid}
                  aria-describedby={isInvalid ? `${field.name}-error` : undefined}
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(o: Option) => (
              <ComboboxItem key={o.value} value={o} disabled={o.disabled}>
                {o.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
