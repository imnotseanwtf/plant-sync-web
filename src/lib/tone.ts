export type Tone = 'success' | 'warning' | 'danger';

export const toneClass: Record<Tone, string> = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400'
};
