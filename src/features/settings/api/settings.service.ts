import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AuthMessageResponse, ChangePasswordInput } from "../types/settings";

/**
 * Account-security data access. Self-contained in the settings feature rather
 * than importing the auth feature, because the boundary rules forbid
 * feature-to-feature imports. The email reset flow lives in the auth feature's
 * public /forgot-password and /reset-password pages.
 *
 * The mutation carries its useful info in the envelope's `message`, so it opts
 * out of the client's unwrap with `{ raw: true }` (ADR-0007).
 */
export const settingsService = {
  /** Signed-in admin changes their own password. Revokes every session. */
  changePassword: (data: ChangePasswordInput) =>
    api.post<AuthMessageResponse>(API_ENDPOINTS.staffAuth.changePassword, data, {
      raw: true,
    }),
};
