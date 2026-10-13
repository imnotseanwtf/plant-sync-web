import { getCurrentUser } from '@/lib/auth/current-user';
import { SidebarTrigger } from '../ui/sidebar';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { UserMenu } from './user-menu';

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b backdrop-blur-md md:h-14'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
      </div>
      <div className='flex items-center gap-2 px-4'>
        <ThemeModeToggle />
        {user && <UserMenu name={user.name} email={user.email} />}
      </div>
    </header>
  );
}
