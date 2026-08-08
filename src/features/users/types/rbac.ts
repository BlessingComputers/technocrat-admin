// Types for the users feature (RBAC: permissions, roles, staff — the `users`
// resource, ADR-0002).
//
// TODO(codegen, ADR-0006): alias the generated response schemas; Zod owns inputs.

export interface Permission {
  id: string;
  name: string;
  description: string;
  group: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  staffCount: number;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: { id: string; name: string };
  customRole: { id: string; name: string } | null;
  isActive: boolean;
}

export interface StaffListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Normalized staff list — the sibling pagination `meta` kept via `{ raw: true }`. */
export interface StaffListResponse {
  data: Staff[];
  meta: StaffListMeta;
}

export interface StaffListParams {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: string;
  search?: string;
}

export interface CreatePermissionInput {
  name: string;
  description: string;
  group: string;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  permissionIds?: string[];
}

export interface OnboardStaffInput {
  firstName: string;
  lastName: string;
  email: string;
}
