'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { deviceOptionsQueryOptions } from '@/features/devices/api/queries';
import { useAppForm } from '@/lib/form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPlantMutation, updatePlantMutation } from '../api/mutations';
import type { Plant } from '../api/types';
import { plantSchema, type PlantFormValues } from '../schemas/plant';

interface PlantFormSheetProps {
  plant?: Plant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlantFormSheet({ plant, open, onOpenChange }: PlantFormSheetProps) {
  const isEdit = !!plant;

  // Only fetch while the sheet is open; rows in the table each mount their own edit sheet.
  const { data: deviceOptions = [] } = useQuery({
    ...deviceOptionsQueryOptions(plant?.id),
    enabled: open
  });

  const createMutation = useMutation({
    ...createPlantMutation,
    onSuccess: () => {
      toast.success('Plant created');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message)
  });

  const updateMutation = useMutation({
    ...updatePlantMutation,
    onSuccess: () => {
      toast.success('Plant updated');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message)
  });

  const form = useAppForm({
    defaultValues: {
      name: plant?.name ?? '',
      deviceIdentifierId: plant?.deviceIdentifierId ?? '',
      moistureLevelMin: plant?.moistureLevelMin,
      moistureLevelMax: plant?.moistureLevelMax,
      humidity: plant?.humidity,
      temperature: plant?.temperature,
      lightIntensity: plant?.lightIntensity
    } as PlantFormValues,
    validators: { onSubmit: plantSchema },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: plant.id, values: value });
      } else {
        await createMutation.mutateAsync(value);
      }
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Plant' : 'New Plant'}</SheetTitle>
          <SheetDescription>
            The pump turns on when soil moisture falls to or below the minimum.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            id='plant-form-sheet'
            className='space-y-4 p-4'
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField
                name='name'
                children={(field) => <field.TextField label='Name' required placeholder='Basil' />}
              />
              <form.AppField
                name='deviceIdentifierId'
                children={(field) => (
                  <field.SelectField
                    label='Device'
                    required
                    options={deviceOptions}
                    placeholder={
                      deviceOptions.length
                        ? 'Select device'
                        : 'No unassigned devices — add one first'
                    }
                  />
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <form.AppField
                  name='moistureLevelMin'
                  children={(field) => (
                    <field.TextField label='Min moisture (%)' required type='number' />
                  )}
                />
                <form.AppField
                  name='moistureLevelMax'
                  children={(field) => (
                    <field.TextField label='Max moisture (%)' required type='number' />
                  )}
                />
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <form.AppField
                  name='humidity'
                  children={(field) => (
                    <field.TextField label='Humidity (%)' required type='number' />
                  )}
                />
                <form.AppField
                  name='temperature'
                  children={(field) => <field.TextField label='Temp (°C)' required type='number' />}
                />
                <form.AppField
                  name='lightIntensity'
                  children={(field) => (
                    <field.TextField label='Light (lux)' required type='number' />
                  )}
                />
              </div>
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton loading={isPending} type='submit' form='plant-form-sheet'>
            {isEdit ? 'Update Plant' : 'Create Plant'}
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function PlantFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Add Plant
      </Button>
      <PlantFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
