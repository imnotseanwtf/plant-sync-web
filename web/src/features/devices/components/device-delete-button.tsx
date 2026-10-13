'use client';

import { DeleteRecordButton } from '@/components/resource/delete-record-button';
import { deleteDevicesAndRefresh } from '../api/mutations';

export function DeviceDeleteButton({ id }: { id: string }) {
  return (
    <DeleteRecordButton
      title='Delete Device Identifier'
      onDelete={() => deleteDevicesAndRefresh([id])}
      redirectTo='/dashboard/device-identifiers'
    />
  );
}
