import { NavGroup } from '@/types';

/**
 * Navigation configuration, used for both the sidebar and the Cmd+K bar.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'Plant Management',
    items: [
      {
        title: 'Plants',
        url: '/dashboard/plants',
        icon: 'plant',
        isActive: false,
        shortcut: ['p', 'p'],
        items: []
      },
      {
        title: 'Devices',
        url: '/dashboard/devices',
        icon: 'device',
        isActive: false,
        shortcut: ['v', 'v'],
        items: []
      }
    ]
  },
  {
    label: 'Administration',
    items: [
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'teams',
        isActive: false,
        shortcut: ['u', 'u'],
        items: []
      }
    ]
  }
];
