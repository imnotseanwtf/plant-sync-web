import { mutationOptions } from '@tanstack/react-query';
import { unwrap } from '@/lib/action-result';
import { getQueryClient } from '@/lib/query-client';
import { createUser, deleteUsers, updateUser, updateUserRole } from './service';
import { userKeys } from './queries';
import type { Role } from '@/lib/auth/rbac';
import type { UserMutationPayload } from './types';

// Invalidation lives in mutationFn (not onSuccess) because components spread these options and
// pass their own onSuccess, which would otherwise replace it.
const invalidate = () => getQueryClient().invalidateQueries({ queryKey: userKeys.all });

export const createUserMutation = mutationOptions({
  mutationFn: async (data: UserMutationPayload) => {
    const result = unwrap(await createUser(data));
    await invalidate();
    return result;
  }
});

export const updateUserMutation = mutationOptions({
  mutationFn: async ({ id, values }: { id: number; values: UserMutationPayload }) => {
    const result = unwrap(await updateUser(id, values));
    await invalidate();
    return result;
  }
});

export async function deleteUsersAndRefresh(ids: (string | number)[]) {
  const result = unwrap(await deleteUsers(ids.map(Number)));
  await invalidate();
  return result;
}

export async function setUserRoleAndRefresh(id: number, role: Role) {
  const result = unwrap(await updateUserRole(id, role));
  await invalidate();
  return result;
}
