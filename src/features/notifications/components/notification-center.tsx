'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { overviewSummaryQueryOptions } from '@/features/overview/api/queries';
import type { DashboardSummary } from '@/features/overview/api/types';
import { toneClass, type Tone } from '@/lib/tone';
import { detectChanges, type AppNotification, type NotificationKind } from '../detect';

const STORAGE_KEY = 'plant-sync:notifications';
const MAX_KEPT = 50;
/** The same alert for the same plant isn't repeated within this window (flapping, other tabs). */
const REPEAT_WINDOW_MS = 10 * 60 * 1000;

const kindIcon: Record<NotificationKind, React.ComponentType> = {
  'needs-water': Icons.droplet,
  offline: Icons.alertCircle,
  'sensor-fault': Icons.warning,
  irrigating: Icons.droplet
};

const kindTone: Record<NotificationKind, Tone> = {
  'needs-water': 'danger',
  offline: 'warning',
  'sensor-fault': 'danger',
  irrigating: 'success'
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
      onOpenChange={(open) => {
        if (!open && unread > 0) update((list) => list.map((n) => ({ ...n, read: true })));
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={<Button variant='secondary' size='icon' className='relative size-8' />}
            />
          }
        >
          <Icons.notification />
          {unread > 0 && (
            <span className='bg-destructive absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white tabular-nums'>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
          <span className='sr-only'>
            {unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          </span>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <PopoverContent align='end' className='w-80 gap-0 p-0'>
        <div className='flex items-center justify-between border-b px-4 py-2'>
          <span className='text-sm font-medium'>Notifications</span>
          {items.length > 0 && (
            <Button variant='ghost' size='sm' onClick={() => update(() => [])}>
              Clear all
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <Empty className='p-6'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icons.notification />
              </EmptyMedia>
              <EmptyTitle>No notifications</EmptyTitle>
              <EmptyDescription>
                You'll be told when a plant needs water, goes offline, has a sensor fault or starts
                irrigating.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className='max-h-96'>
            <ItemGroup className='p-1'>
              {items.map((n) => {
                const Icon = kindIcon[n.kind];
                return (
                  <Item
                    key={n.id}
                    size='xs'
                    render={
                      // oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- content arrives via Item's render composition
                      <Link href={`/dashboard/plants/${n.plantId}/edit`} />
                    }
                  >
                    <ItemMedia variant='icon' className={toneClass[kindTone[n.kind]]}>
                      <Icon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {n.title}
                        {!n.read && <span className='bg-primary size-1.5 rounded-full' />}
                      </ItemTitle>
                      <ItemDescription>
                        {n.description} · {ago(n.at)}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
