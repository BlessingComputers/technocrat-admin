import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { StaffSession } from "@/lib/auth/permissions";
import type { AuthResponse, ResetPasswordDto } from "../types/auth";

/**
 * Auth feature data access (staff-only).
 *
 * Ported from the main app's dual-audience `auth.service.ts`; the customer
 * branch (`getCustomerProfile`) is dropped — this app has one audience.
 *
 * The fetch client unwraps the response envelope (ADR-0007), so `api.get`
 * returns the inner payload directly. `getStaffProfileClient` therefore gets a
 * `RawStaffProfile`. The reset/forgot/login mutations carry their useful info
 * in the envelope's `message`, so they opt out with `{ raw: true }` and keep the
 * full `AuthResponse` envelope.
 */

/** Shape of the staff profile as the backend returns it (pre-codegen). */
interface RawStaffProfile {
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
  customRole?: {
    name?: string;
    permissions?: {
      permission: { id: string; name: string; group?: string };
    }[];
  };
}

function mapStaffProfile(data: RawStaffProfile): StaffSession {
  const roleName = data.customRole?.name ?? data.role ?? "STAFF";
  const rawPermissions = data.customRole?.permissions ?? [];

  return {
    id: data.staffId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: { id: data.role ?? "STAFF", name: roleName },
    avatarUrl: data.avatarUrl,
    permissions: rawPermissions.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      group: rp.permission.group ?? rp.permission.name.split(":")[0],
    })),
  };
}

export const authService = {
  resetPassword: (data: ResetPasswordDto): Promise<AuthResponse> =>
    api.post<AuthResponse>(API_ENDPOINTS.staffAuth.resetPassword, data, {
      raw: true,
    }),

  forgotPassword: (email: string): Promise<AuthResponse> =>
    api.post<AuthResponse>(
      API_ENDPOINTS.staffAuth.forgotPassword,
      { email },
      { raw: true },
    ),

  staffLogin: (email: string, password: string): Promise<AuthResponse> =>
    api.post<AuthResponse>(
      API_ENDPOINTS.staffAuth.login,
      { email, password },
      { raw: true },
    ),

  getStaffProfileClient: async (): Promise<StaffSession | null> => {
    // Let errors throw (do NOT swallow to null): on a failed refetch React Query
    // retains the previous session data, so a transient network blip can't bounce
    // an authenticated user. A real 401 is already handled by the fetch client
    // (silent refresh, or redirect to /login when refresh fails). `null` is
    // reserved for an explicit "no session" body.
    const data = await api.get<RawStaffProfile | null>(
      API_ENDPOINTS.staffAuth.profile,
    );
    if (!data) return null;
    return mapStaffProfile(data);
  },
};
