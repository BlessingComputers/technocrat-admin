import { SecuritySettings } from "./security-settings";

/**
 * The Account half of `/settings` — everything scoped to the signed-in admin
 * rather than the store. The signed-in admin comes from the real session
 * provider inside `SecuritySettings` (`useStaffSession`), not a mock.
 *
 * No `PageHeader` here: the page-level header and the Account / Store tab bar
 * belong to the app-layer settings workspace, which composes this alongside
 * store-level sections from other features.
 */
export function AccountSettingsView() {
  return (
    <div className="grid gap-6">
      <SecuritySettings />
    </div>
  );
}
