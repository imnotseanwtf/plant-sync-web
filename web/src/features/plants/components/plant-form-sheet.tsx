'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { FormSheet } from '@/components/resource/form-sheet';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { deviceOptionsQueryOptions } from '@/features/devices/api/queries';
import { useAppForm } from '@/lib/form';
import { createPlantMutation, deletePlantsAndRefresh, updatePlantMutation } from '../api/mutations';
import type { Plant } from '../api/types';
import { plantSchema, type PlantFormValues } from '../schemas/plant';

const FORM_ID = 'plant-form-sheet';

export function PlantFormSheet({
  plant,
  open,
  onOpenChange
}: {
  plant?: Plant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const another = useRef(false);

  // The create form only offers devices that don't have a plant yet.
  const { data: freeDevices = [] } = useQuery({
    ...deviceOptionsQueryOptions(),
    enabled: open && !plant
  });

  const create = useMutation(createPlantMutation);
  const update = useMutation(updatePlantMutation);
  const initial = {
    deviceIdentifierId: plant?.deviceIdentifierId ?? '',
    name: plant?.name ?? '',
    moistureLevelMin: plant?.moistureLevelMin,
    moistureLevelMax: plant?.moistureLevelMax,
    humidity: plant?.humidity,
    temperature: plant?.temperature,
    lightIntensity: plant?.lightIntensity
  } as PlantFormValues;

  const form = useAppForm({
    defaultValues: initial,
    validators: { onSubmit: plantSchema },
    onSubmit: async ({ value }) => {
      try {
        if (plant) {
          await update.mutateAsync({ id: plant.id, values: value });
          toast.success('Saved');
          onOpenChange(false);
          router.refresh(); // the detail page title is server-rendered
        } else {
          await create.mutateAsync(value);
          toast.success('Created');
          if (another.current) form.reset(initial);
          else onOpenChange(false);
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  });

  useEffect(() => {
    if (open) form.reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    plant?.name,
    plant?.moistureLevelMin,
    plant?.moistureLevelMax,
    plant?.humidity,
    plant?.temperature,
    plant?.lightIntensity
  ]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={plant ? 'Edit Plant' : 'New Plant'}
      description='The pump turns on when soil moisture falls to or below the minimum.'
      formId={FORM_ID}
      mode={plant ? 'edit' : 'create'}
      pending={create.isPending || update.isPending}
      onCreateAnother={() => {
        another.current = true;
        form.handleSubmit();
      }}
      onDelete={plant ? () => deletePlantsAndRefresh([plant.id]) : undefined}
      onDeleted={() => router.push('/dashboard/plants')}
      deleteTitle={plant ? `Delete ${plant.name}?` : undefined}
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
          {plant ? (
            // The device can't be changed once a plant exists.
            <Field>
              <FieldLabel htmlFor='device-name'>Device identifier</FieldLabel>
              <Input id='device-name' value={plant.deviceName} disabled readOnly />
            </Field>
          ) : (
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
          )}
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
