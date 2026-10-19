'use client';

import { useCan } from '@/components/auth/current-user-provider';
import { DeleteRecordButton } from '@/components/resource/delete-record-button';
import { deletePlantsAndRefresh } from '../api/mutations';

export function PlantDeleteButton({ id }: { id: number }) {
  if (!useCan()('plants:write')) return null;
  return (
    <DeleteRecordButton
      title='Delete this plant?'
      onDelete={() => deletePlantsAndRefresh([id])}
      redirectTo='/dashboard/plants'
    />
  );
}
