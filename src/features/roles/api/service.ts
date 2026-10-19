import { requirePermission } from '@/lib/auth/current-user';
import { prisma } from '@/lib/prisma';
import type { AppUser } from '@/features/users/api/types';

/** Server-only loader for the roles screen (not a server action, so it isn't a public endpoint). */
export async function getRoleOverview(): Promise<AppUser[]> {
  await requirePermission('users:manage');
  const rows = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, userType: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    take: 500
  });
  return rows.map((u) => ({ ...u, id: Number(u.id) }));
}
