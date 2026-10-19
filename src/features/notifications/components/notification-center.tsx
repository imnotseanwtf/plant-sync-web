'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { overviewSummaryQueryOptions } from '@/features/overview/api/queries';
import type { DashboardSummary } from '@/features/overview/api/types';
import { detectChanges, type AppNotification, type NotificationKind } from '../detect';

const STORAGE_KEY = 'plant-sync:notifications';
const MAX_KEPT = 50;
/** The same alert for the same plant isn't repeated within this window (flapping, other tabs). */
const REPEAT_WINDOW_MS = 10 * 60 * 1000;

const kindIcon: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  'needs-water': Icons.droplet,
  offline: Icons.alertCircle,
  'sensor-fault': Icons.warning,
  irrigating: Icons.droplet
};

// Browser storage can be blocked or empty, so every access is guarded.
function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function save(list: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Not persisting is fine; the list still works for this session.
  }
}

function ago(at: number) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Bell in the header: toasts and keeps a list when a plant's status changes between polls. */
export function NotificationCenter() {
  const { data } = useQuery(overviewSummaryQueryOptions());
  const [items, setItems] = useState<AppNotification[]>([]);
  const previous = useRef<DashboardSummary | null>(null);

  useEffect(() => {
    setItems(load());
  }, []);

  const update = useCallback((fn: (list: AppNotification[]) => AppNotification[]) => {
    setItems((list) => {
      const next = fn(list);
      save(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    const prev = previous.current;
    previous.current = data;
    // The first summary is only a baseline; the dashboard's attention strip covers what is wrong now.
    if (!prev || prev.generatedAt === data.generatedAt) return;

    // Read storage fresh so alerts raised by another tab are respected.
    const existing = load();
    const fresh = detectChanges(prev, data).filter(
      (n) =>
        !existing.some(
          (e) => e.plantId === n.plantId && e.kind === n.kind && n.at - e.at < REPEAT_WINDOW_MS
        )
    );
    if (fresh.length === 0) return;

    for (const n of fresh) {
      const show = n.kind === 'irrigating' ? toast.info : toast.warning;
      show(n.title, { description: n.description });
    }
    update(() => [...fresh, ...existing].slice(0, MAX_KEPT));
  }, [data, update]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover
      onOpenChange={(open) =>
        !open && unread > 0 && update((l) => l.map((n) => ({ ...n, read: true })))
      }
    >
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='relative'
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          />
        }
      >
        <Icons.notification className='size-4' />
        {unread > 0 && (
          <span className='bg-destructive absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-medium text-white tabular-nums'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-0'>
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <span className='text-sm font-medium'>Notifications</span>
          {items.length > 0 && (
            <Button variant='ghost' size='sm' onClick={() => update(() => [])}>
              Clear all
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className='text-muted-foreground px-4 py-8 text-center text-sm'>
            Nothing yet. You'll be told when a plant needs water, goes offline, has a sensor fault
            or starts irrigating.
          </p>
        ) : (
          <ul className='max-h-96 divide-y overflow-y-auto'>
            {items.map((n) => {
              const Icon = kindIcon[n.kind];
              return (
                <li key={n.id}>
                  <Link
                    href={`/dashboard/plants/${n.plantId}/edit`}
                    className='hover:bg-muted/50 flex gap-3 px-4 py-3'
                  >
                    <Icon
                      className={`mt-0.5 size-4 shrink-0 ${n.kind === 'irrigating' ? 'text-primary' : 'text-destructive'}`}
                    />
                    <span className='min-w-0 flex-1'>
                      <span className='flex items-center gap-2 text-sm font-medium'>
                        {n.title}
                        {!n.read && <span className='bg-primary size-1.5 rounded-full' />}
                      </span>
                      <span className='text-muted-foreground block text-xs'>{n.description}</span>
                      <span className='text-muted-foreground block text-xs'>{ago(n.at)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
