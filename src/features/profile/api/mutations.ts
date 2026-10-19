import { mutationOptions } from '@tanstack/react-query';
import { unwrap } from '@/lib/action-result';
import { getQueryClient } from '@/lib/query-client';
import { userKeys } from '@/features/users/api/queries';
import { changePassword, updateProfile } from './service';
import type { PasswordPayload, ProfilePayload } from './types';

export const updateProfileMutation = mutationOptions({
  mutationFn: async (data: ProfilePayload) => {
    const result = unwrap(await updateProfile(data));
    // The users table shows names and emails.
    await getQueryClient().invalidateQueries({ queryKey: userKeys.all });
    return result;
  }
});

export const changePasswordMutation = mutationOptions({
  mutationFn: async (data: PasswordPayload) => unwrap(await changePassword(data))
});
