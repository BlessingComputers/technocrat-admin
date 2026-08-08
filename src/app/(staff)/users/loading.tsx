import { PageHeader } from "@/components/shared/page-header";
import { RbacTabsSkeleton } from "@/features/users";

export default function UsersLoading() {
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage staff accounts, roles and permissions"
      />
      <RbacTabsSkeleton />
    </div>
  );
}
