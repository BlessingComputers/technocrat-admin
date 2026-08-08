import { PageHeader } from "@/components/shared/page-header";
import { RbacTabs } from "./rbac-tabs";

/**
 * Users management view: staff accounts, roles, and permissions (RBAC). The
 * tab state is URL-seeded (`?tab=`) by `RbacTabs` (ADR-0005).
 */
export function UsersView() {
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage staff accounts, roles and permissions"
      />
      <RbacTabs />
    </div>
  );
}
