'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toast } from 'sonner';
import { FormFooter } from '@/components/resource/form-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
      className='flex flex-col gap-4'
      onSubmit={(e) => {
        e.preventDefault();
        another.current = false;
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Plant Details</CardTitle>
        </CardHeader>
        <CardContent>
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
                      freeDevices.length
                        ? 'Select a device'
                        : 'No unassigned devices. Add one first.'
                    }
                  />
                )}
              />
            )}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <form.AppField
                name='name'
                children={(field) => <field.TextField label='Name' required />}
              />
              <form.AppField
                name='moistureLevelMin'
                children={(field) => (
                  <field.TextField label='Moisture level min (%)' required type='number' />
                )}
              />
              <form.AppField
                name='moistureLevelMax'
                children={(field) => (
                  <field.TextField label='Moisture level max (%)' required type='number' />
                )}
              />
              <form.AppField
                name='humidity'
                children={(field) => (
                  <field.TextField label='Humidity (%)' required type='number' />
                )}
              />
              <form.AppField
                name='temperature'
                children={(field) => (
                  <field.TextField label='Temperature (°C)' required type='number' />
                )}
              />
              <form.AppField
                name='lightIntensity'
                children={(field) => (
                  <field.TextField label='Light intensity (lux)' required type='number' />
                )}
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
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
