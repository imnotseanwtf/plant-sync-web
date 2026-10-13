'use client';

import { DeleteRecordButton } from '@/components/resource/delete-record-button';
import { deletePlantsAndRefresh } from '../api/mutations';

export function PlantDeleteButton({ id }: { id: number }) {
  return (
    <DeleteRecordButton
      title='Delete Plant'
      onDelete={() => deletePlantsAndRefresh([id])}
      redirectTo='/dashboard/plants'
    />
  );
}
