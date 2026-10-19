import { NavGroup } from '@/types';

/**
 * Navigation: Dashboard on top, then "User Management" (Users and Roles) and "Plant Management". Used for both the
 * sidebar and the Cmd+K bar.
 */
export const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'home',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'User Management',
    items: [
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'teams',
        isActive: false,
        access: { permission: 'view:users' },
        shortcut: ['u', 'u'],
        items: []
      },
      {
        title: 'Roles',
        url: '/dashboard/roles',
        icon: 'shield',
        isActive: false,
        access: { permission: 'view:roles' },
        shortcut: ['r', 'r'],
        items: []
      }
    ]
  },
  {
    label: 'Plant Management',
    items: [
      {
        title: 'Device Identifiers',
        url: '/dashboard/device-identifiers',
        icon: 'device',
        isActive: false,
        access: { permission: 'view:devices' },
        shortcut: ['v', 'v'],
        items: []
      },
      {
        title: 'Plants',
        url: '/dashboard/plants',
        icon: 'plant',
        isActive: false,
        access: { permission: 'view:plants' },
        shortcut: ['p', 'p'],
        items: []
      }
    ]
  }
];
