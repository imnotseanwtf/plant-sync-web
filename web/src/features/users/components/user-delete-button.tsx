'use client';

import { DeleteRecordButton } from '@/components/resource/delete-record-button';
import { deleteUsersAndRefresh } from '../api/mutations';

export function UserDeleteButton({ id }: { id: number }) {
  return (
    <DeleteRecordButton
      title='Delete this user?'
      onDelete={() => deleteUsersAndRefresh([id])}
      redirectTo='/dashboard/users'
    />
  );
}
