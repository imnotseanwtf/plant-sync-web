import 'server-only';
import { Prisma } from '../../../generated/prisma/client';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';

export const LAST_MANAGER = 'At least one user must keep the permission to edit roles.';

class LastManagerError extends Error {}

const managers = (tx: Prisma.TransactionClient) =>
  tx.user.count({
    where: { roles: { some: { role: { permissions: { has: 'edit:roles' } } } } }
  });

/**
 * Runs `change` in a transaction and rolls it back if it would leave nobody able to manage users
 * (deleting a user or role, unassigning a role, or removing `edit:roles` from a role): the last
 * person who can edit roles is the way back from any other mistake.
 */
export async function guardManagers<T>(
  change: (tx: Prisma.TransactionClient) => Promise<T>,
  messages: { unique?: string; notFound?: string } = {}
): Promise<ActionResult<T>> {
  try {
    return ok(
      await prisma.$transaction(async (tx) => {
        const before = await managers(tx);
        const result = await change(tx);
        // Only block a change that takes the count to zero, so an already-unmanaged database can
        // still be repaired.
        if (before > 0 && (await managers(tx)) === 0) throw new LastManagerError();
        return result;
      })
    );
  } catch (e) {
    if (e instanceof LastManagerError) return fail(LAST_MANAGER);
    return dbError(e, messages);
  }
}
