import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AuthMessageResponse, ResetPasswordInput } from "../types/settings";

/**
 * Account-security data access (password reset/forgot). Self-contained in the
 * settings feature rather than importing the auth feature — the boundary rules
 * forbid feature→feature imports (same pattern as analytics' own data calls).
 * Both hit the shared `staffAuth` endpoints.
 *
 * These mutations carry their useful info in the envelope's `message`, so they
 * opt out of the client's unwrap with `{ raw: true }` (ADR-0007).
 */
export const settingsService = {
  /** Email the signed-in admin a fresh password-reset token. */
  requestPasswordToken: (email: string) =>
    api.post<AuthMessageResponse>(
      API_ENDPOINTS.staffAuth.forgotPassword,
      { email },
      { raw: true },
    ),

  resetPassword: (data: ResetPasswordInput) =>
    api.post<AuthMessageResponse>(API_ENDPOINTS.staffAuth.resetPassword, data, {
      raw: true,
    }),
};
