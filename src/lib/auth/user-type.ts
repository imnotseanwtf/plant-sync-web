// What kind of person the account belongs to. Separate from `Role`: the type is a label,
// the role is what grants permissions. Safe to import from client code.

export const USER_TYPES = ['farmer', 'admin', 'maintenance'] as const;
export type UserType = (typeof USER_TYPES)[number];

export const USER_TYPE_LABELS: Record<UserType, string> = {
  farmer: 'Farmer',
  admin: 'Admin',
  maintenance: 'Maintenance'
};
