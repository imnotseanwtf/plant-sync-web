'use client';

import { useCan } from '@/components/auth/current-user-provider';
import type { Permission } from '@/lib/auth/rbac';
import type { NavItem, NavGroup } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  const can = useCan();
  return items.filter((item) => can(item.access?.permission as Permission | undefined));
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const can = useCan();
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.access?.permission as Permission | undefined))
    }))
    .filter((group) => group.items.length > 0);
}
