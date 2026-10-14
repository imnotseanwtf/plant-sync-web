'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { FormSheet } from '@/components/resource/form-sheet';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { deviceOptionsQueryOptions } from '@/features/devices/api/queries';
import { useAppForm } from '@/lib/form';
import { createPlantMutation } from '../api/mutations';
import { plantSchema, type PlantFormValues } from '../schemas/plant';

const FORM_ID = 'plant-form-sheet';

const initial = {
  deviceIdentifierId: '',
  name: '',
  moistureLevelMin: undefined,
  moistureLevelMax: undefined,
  humidity: undefined,
  temperature: undefined,
  lightIntensity: undefined
} as unknown as PlantFormValues;

/** Create-only side panel. Editing a plant happens on its page, next to the charts. */
export function PlantFormSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const another = useRef(false);

  // Only devices that don't have a plant yet can be picked.
  const { data: freeDevices = [] } = useQuery({ ...deviceOptionsQueryOptions(), enabled: open });
  const create = useMutation(createPlantMutation);

  const form = useAppForm({
    defaultValues: initial,
    validators: { onSubmit: plantSchema },
    onSubmit: async ({ value }) => {
      try {
        await create.mutateAsync(value);
        toast.success('Created');
        if (another.current) form.reset(initial);
        else onOpenChange(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  });

  useEffect(() => {
    if (open) form.reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title='New Plant'
      description='The pump turns on when soil moisture falls to or below the minimum.'
      formId={FORM_ID}
      mode='create'
      pending={create.isPending}
      onCreateAnother={() => {
        another.current = true;
        form.handleSubmit();
      }}
    >
      <form
        id={FORM_ID}
        onSubmit={(e) => {
          e.preventDefault();
          another.current = false;
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='deviceIdentifierId'
            children={(field) => (
              <field.SelectField
                label='Device identifier'
                required
                options={freeDevices}
                placeholder={
                  freeDevices.length ? 'Select a device' : 'No unassigned devices. Add one first.'
                }
              />
            )}
          />
          <form.AppField
            name='name'
            children={(field) => <field.TextField label='Name' required placeholder='Basil' />}
          />
          <div className='grid grid-cols-2 gap-4'>
            <form.AppField
              name='moistureLevelMin'
              children={(field) => (
                <field.TextField label='Moisture min (%)' required type='number' />
              )}
            />
            <form.AppField
              name='moistureLevelMax'
              children={(field) => (
                <field.TextField label='Moisture max (%)' required type='number' />
              )}
            />
          </div>
          <div className='grid grid-cols-3 gap-4'>
            <form.AppField
              name='humidity'
              children={(field) => <field.TextField label='Humidity (%)' required type='number' />}
            />
            <form.AppField
              name='temperature'
              children={(field) => <field.TextField label='Temp (°C)' required type='number' />}
            />
            <form.AppField
              name='lightIntensity'
              children={(field) => <field.TextField label='Light (lux)' required type='number' />}
            />
          </div>
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

export function PlantFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> New plant
      </Button>
      <PlantFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
