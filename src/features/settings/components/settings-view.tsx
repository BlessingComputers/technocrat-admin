import { PageHeader } from "@/components/shared/page-header";
import { SecuritySettings } from "./security-settings";

/**
 * Account settings view. The signed-in admin comes from the real session
 * provider inside `SecuritySettings` (`useStaffSession`), not a mock.
 */
export function SettingsView() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Account Settings"
        description="Manage your administrative account and security preferences"
      />
      <div className="grid gap-6">
        <SecuritySettings />
      </div>
    </div>
  );
}
