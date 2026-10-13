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
import { useAppForm } from '@/lib/form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createDeviceMutation, updateDeviceMutation } from '../api/mutations';
import type { Device } from '../api/types';
import { deviceSchema, type DeviceFormValues } from '../schemas/device';

interface DeviceFormSheetProps {
  device?: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceFormSheet({ device, open, onOpenChange }: DeviceFormSheetProps) {
  const isEdit = !!device;

  const createMutation = useMutation({
    ...createDeviceMutation,
    onSuccess: () => {
      toast.success('Device created');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message)
  });

  const updateMutation = useMutation({
    ...updateDeviceMutation,
    onSuccess: () => {
      toast.success('Device updated');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message)
  });

  const form = useAppForm({
    defaultValues: { name: device?.name ?? '' } as DeviceFormValues,
    validators: { onSubmit: deviceSchema },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: device.id, values: value });
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
          <SheetTitle>{isEdit ? 'Rename Device' : 'New Device'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Change the device name. Its ID stays the same, so the firmware keeps working.'
              : 'A unique ID is generated; copy it into the ESP32 firmware afterwards.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            id='device-form-sheet'
            className='space-y-4 p-4'
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField
                name='name'
                children={(field) => (
                  <field.TextField label='Name' required placeholder='Greenhouse ESP32' />
                )}
              />
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton loading={isPending} type='submit' form='device-form-sheet'>
            {isEdit ? 'Save' : 'Create Device'}
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function DeviceFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Add Device
      </Button>
      <DeviceFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
