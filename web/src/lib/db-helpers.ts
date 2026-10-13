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

/** Parse the `sort` search param (JSON `[{ id, desc }]`) into allow-listed Prisma orderBy fields. */
export function parseSort(sort: string | undefined, fields: Record<string, string>) {
  if (!sort) return [];
  try {
    const parsed = JSON.parse(sort) as { id: string; desc: boolean }[];
    return parsed
      .filter((s) => typeof s.id === 'string' && s.id in fields)
      .map((s) => ({ [fields[s.id]]: s.desc ? 'desc' : 'asc' }) as Record<string, 'asc' | 'desc'>);
  } catch {
    return [];
  }
}

/** Clamp client-supplied paging values. */
export function paging(page = 1, limit = 10) {
  const take = Math.min(Math.max(Math.trunc(limit) || 10, 1), 100);
  const skip = (Math.max(Math.trunc(page) || 1, 1) - 1) * take;
  return { skip, take };
}
