import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  CreatePermissionInput,
  CreateRoleInput,
  OnboardStaffInput,
  Permission,
  Role,
  Staff,
  StaffListParams,
  StaffListResponse,
} from "../types/rbac";

/**
 * RBAC data access (permissions, roles, staff assignment — the `users`
 * resource, ADR-0002).
 *
 * The client unwraps the response envelope (ADR-0007), so methods return the
 * inner payload directly — except `getStaff`, which uses `{ raw: true }` to keep
 * the sibling pagination `meta`, then normalizes the array-or-paginated shape.
 */

/** Raw staff envelope before normalization (the `{ raw: true }` hatch). */
interface StaffEnvelope {
  data?: Staff[] | unknown;
  meta?: Partial<StaffListResponse["meta"]>;
}

/**
 * Coerce a list response to an array. The RBAC endpoints don't all use the
 * standard `{ success, data }` envelope the client unwraps (ADR-0007), so a
 * bare `{ data: [...] }` can arrive un-unwrapped — handle both. TODO(codegen,
 * ADR-0006): drop once the response schemas are pinned.
 */
function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: T[] }).data;
  }
  return [];
}

export const rbacService = {
  // ── Permissions ────────────────────────────────────────────────
  getPermissions: async (group?: string) =>
    asArray<Permission>(
      await api.get<unknown>(API_ENDPOINTS.rbac.permissions, {
        params: group ? { group } : undefined,
      }),
    ),

  createPermission: (data: CreatePermissionInput) =>
    api.post<Permission>(API_ENDPOINTS.rbac.permissions, data),

  deletePermission: (id: string) =>
    api.delete<unknown>(`${API_ENDPOINTS.rbac.permissions}/${id}`),

  // ── Roles ──────────────────────────────────────────────────────
  getRoles: async () =>
    asArray<Role>(await api.get<unknown>(API_ENDPOINTS.rbac.roles)),

  createRole: (data: CreateRoleInput) =>
    api.post<Role>(API_ENDPOINTS.rbac.roles, data),

  deleteRole: (id: string) =>
    api.delete<unknown>(`${API_ENDPOINTS.rbac.roles}/${id}`),

  /** Replace ALL of a role's permissions with the given set (PUT). */
  syncRolePermissions: (roleId: string, permissionIds: string[]) =>
    api.put<Role>(`${API_ENDPOINTS.rbac.roles}/${roleId}/permissions`, {
      permissionIds,
    }),

  // ── Staff ──────────────────────────────────────────────────────
  getStaff: async (params?: StaffListParams): Promise<StaffListResponse> => {
    const env = await api.get<StaffEnvelope>(API_ENDPOINTS.staffAuth.list, {
      params: params as Record<string, string | number | undefined>,
      raw: true,
    });

    const rows = Array.isArray(env?.data) ? (env.data as Staff[]) : [];
    return {
      data: rows,
      meta: {
        total: env?.meta?.total ?? rows.length,
        page: env?.meta?.page ?? params?.page ?? 1,
        limit: env?.meta?.limit ?? params?.limit ?? 20,
        totalPages: env?.meta?.totalPages ?? 1,
      },
    };
  },

  assignStaffRole: (staffId: string, roleId: string | null) =>
    api.patch<unknown>(`${API_ENDPOINTS.rbac.staff}/${staffId}/role`, {
      roleId,
    }),

  onboardStaff: (data: OnboardStaffInput) =>
    api.post<{ staffId: string }>(API_ENDPOINTS.staffAuth.onboard, data),
};
