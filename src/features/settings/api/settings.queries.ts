import { useMutation } from "@tanstack/react-query";
import { hardNavigate } from "@/lib/auth/hard-navigate";
import { logoutAction } from "@/lib/auth/logout-action";
import { settingsService } from "./settings.service";
import type { ChangePasswordInput } from "../types/settings";

/**
 * On success the backend has revoked every session, this one included. Clear
 * the admin's own cookies too (it sets its own names, which the backend's
 * clearStaffCookies may not match), then do a full load of /login so no stale
 * client state or socket survives. Errors render inline in the form.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordInput) => settingsService.changePassword(data),
    onSuccess: async () => {
      await logoutAction().catch(() => null);
      hardNavigate("/login?notice=password-changed");
    },
  });
}
