import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import RoleListing from '@/features/roles/components/role-listing';
import { RoleFormSheetTrigger } from '@/features/roles/components/role-form-sheet';
import { requirePagePermission } from '@/lib/auth/current-user';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Roles' };

export default async function RolesPage(props: { searchParams: Promise<SearchParams> }) {
  await requirePagePermission('view:roles');
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Roles'
      pageDescription='Create roles and choose what each one is allowed to do. Give them to users on the Users page.'
      pageHeaderAction={<RoleFormSheetTrigger />}
    >
      <RoleListing />
    </PageContainer>
  );
}
