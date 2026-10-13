import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOut } from '@/features/auth/actions';

/** Filament's default dashboard widget: "Welcome <name>" with a Sign out button. */
export function AccountWidget({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className='max-w-xl flex-row items-center gap-4 px-6 py-5'>
      <span className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full text-sm font-semibold'>
        {initials}
      </span>
      <div className='min-w-0 flex-1'>
        <p className='font-semibold'>Welcome</p>
        <p className='text-muted-foreground truncate text-sm'>{name}</p>
      </div>
      <form action={signOut}>
        <Button type='submit' variant='outline'>
          <Icons.logout className='mr-2 size-4' />
          Sign out
        </Button>
      </form>
    </Card>
  );
}
