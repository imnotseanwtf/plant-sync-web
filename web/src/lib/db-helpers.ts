import 'server-only';
import { Prisma } from '../../generated/prisma/client';
import { fail } from './action-result';

/** Map expected Prisma failures to user-facing messages; rethrow anything unexpected. */
export function dbError(error: unknown, messages: { unique?: string; notFound?: string }) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return fail(messages.unique ?? 'That value is already in use.');
    if (error.code === 'P2025') return fail(messages.notFound ?? 'Record not found.');
  }
  throw error;
}

/** Map the `sort`/`dir` search params onto an allow-listed Prisma orderBy (empty if unknown). */
export function sortBy<T>(
  sort: string | undefined,
  dir: 'asc' | 'desc' | undefined,
  fields: Record<string, (dir: 'asc' | 'desc') => T>
): T[] {
  if (!sort || !(sort in fields)) return [];
  return [fields[sort](dir === 'desc' ? 'desc' : 'asc')];
}

/** Clamp client-supplied paging values. */
export function paging(page = 1, limit = 10) {
  const take = Math.min(Math.max(Math.trunc(limit) || 10, 1), 100);
  const skip = (Math.max(Math.trunc(page) || 1, 1) - 1) * take;
  return { skip, take };
}
