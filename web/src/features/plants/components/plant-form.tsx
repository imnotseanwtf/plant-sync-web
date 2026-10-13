'use client';

import { useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Fieldset } from '@/components/resource/fieldset';
import { FormFooter } from '@/components/resource/form-footer';
import { FormInput, FormSelect } from '@/components/resource/form-controls';
import { deviceOptionsQueryOptions } from '@/features/devices/api/queries';
import { useAppForm } from '@/lib/form';
import { createPlantMutation, updatePlantMutation } from '../api/mutations';
import type { Plant } from '../api/types';
import { plantSchema, type PlantFormValues } from '../schemas/plant';

const LIST = '/dashboard/plants';

export function PlantForm({ plant }: { plant?: Plant }) {
  const router = useRouter();
  const another = useRef(false);

  // The create form only offers devices that don't have a plant yet.
  const { data: freeDevices = [] } = useQuery({ ...deviceOptionsQueryOptions(), enabled: !plant });
  const deviceOptions = plant
    ? [{ value: plant.deviceIdentifierId, label: plant.deviceName }]
    : freeDevices;

  const create = useMutation(createPlantMutation);
  const update = useMutation(updatePlantMutation);

  const form = useAppForm({
    defaultValues: {
      deviceIdentifierId: plant?.deviceIdentifierId ?? '',
      name: plant?.name ?? '',
      moistureLevelMin: plant?.moistureLevelMin,
      moistureLevelMax: plant?.moistureLevelMax,
      humidity: plant?.humidity,
      temperature: plant?.temperature,
      lightIntensity: plant?.lightIntensity
    } as PlantFormValues,
    validators: { onSubmit: plantSchema },
    onSubmit: async ({ value }) => {
      try {
        if (plant) {
          await update.mutateAsync({ id: plant.id, values: value });
          toast.success('Saved');
        } else {
          const created = await create.mutateAsync(value);
          toast.success('Created');
          if (another.current) form.reset();
          else router.push(`${LIST}/${created.id}/edit`);
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  });

  return (
    <form
      className='flex flex-col gap-6'
      onSubmit={(e) => {
        e.preventDefault();
        another.current = false;
        form.handleSubmit();
      }}
    >
      <Fieldset legend='Plant Details'>
        <form.Field name='deviceIdentifierId'>
          {(field) => (
            <FormSelect
              field={field}
              label='Device identifier'
              required={!plant}
              options={deviceOptions}
              disabled={!!plant}
              className='md:col-span-2'
            />
          )}
        </form.Field>
        <form.Field name='name'>
          {(field) => <FormInput field={field} label='Name' required />}
        </form.Field>
        <form.Field name='moistureLevelMin'>
          {(field) => (
            <FormInput field={field} label='Moisture level min' type='number' suffix='%' required />
          )}
        </form.Field>
        <form.Field name='moistureLevelMax'>
          {(field) => (
            <FormInput field={field} label='Moisture level max' type='number' suffix='%' required />
          )}
        </form.Field>
        <form.Field name='humidity'>
          {(field) => (
            <FormInput field={field} label='Humidity' type='number' suffix='%' required />
          )}
        </form.Field>
        <form.Field name='temperature'>
          {(field) => (
            <FormInput field={field} label='Temperature' type='number' suffix='°C' required />
          )}
        </form.Field>
        <form.Field name='lightIntensity'>
          {(field) => (
            <FormInput field={field} label='Light intensity' type='number' suffix='lux' required />
          )}
        </form.Field>
      </Fieldset>
      <FormFooter
        mode={plant ? 'edit' : 'create'}
        pending={create.isPending || update.isPending}
        cancelHref={LIST}
        onCreateAnother={() => {
          another.current = true;
          form.handleSubmit();
        }}
      />
    </form>
  );
}
