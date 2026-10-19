'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCan } from '@/components/auth/current-user-provider';
import { FormFooter } from '@/components/resource/form-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAppForm } from '@/lib/form';
import { updatePlantMutation } from '../api/mutations';
import type { Plant } from '../api/types';
import { plantSchema, type PlantFormValues } from '../schemas/plant';

/** The Edit Plant form (the device can't be changed once a plant exists). */
export function PlantForm({ plant }: { plant: Plant }) {
  const update = useMutation(updatePlantMutation);
  const canWrite = useCan()('plants:write');

  const form = useAppForm({
    defaultValues: {
      deviceIdentifierId: plant.deviceIdentifierId,
      name: plant.name,
      moistureLevelMin: plant.moistureLevelMin,
      moistureLevelMax: plant.moistureLevelMax,
      humidity: plant.humidity,
      temperature: plant.temperature,
      lightIntensity: plant.lightIntensity
    } as PlantFormValues,
    validators: { onSubmit: plantSchema },
    onSubmit: async ({ value }) => {
      try {
        await update.mutateAsync({ id: plant.id, values: value });
        toast.success('Saved');
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
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Plant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <fieldset disabled={!canWrite} className='contents'>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='device-name'>Device identifier</FieldLabel>
                <Input id='device-name' value={plant.deviceName} disabled readOnly />
              </Field>
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
          </fieldset>
        </CardContent>
      </Card>
      {canWrite && (
        <FormFooter mode='edit' pending={update.isPending} cancelHref='/dashboard/plants' />
      )}
    </form>
  );
}
