import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import { rbacService } from "./rbac.service";
import type {
  CreatePermissionInput,
  CreateRoleInput,
  OnboardStaffInput,
  StaffListParams,
} from "../types/rbac";

export const rbacKeys = {
  all: ["rbac"] as const,
  permissions: () => [...rbacKeys.all, "permissions"] as const,
  permissionGroup: (group?: string) =>
    [...rbacKeys.permissions(), group] as const,
  roles: () => [...rbacKeys.all, "roles"] as const,
  staffs: () => [...rbacKeys.all, "staff"] as const,
  staff: (params?: StaffListParams) => [...rbacKeys.staffs(), params] as const,
};

// ── Queries ────────────────────────────────────────────────────
export function usePermissions(group?: string) {
  return useQuery({
    queryKey: rbacKeys.permissionGroup(group),
    queryFn: () => rbacService.getPermissions(group),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: rbacKeys.roles(),
    queryFn: () => rbacService.getRoles(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStaff(params?: StaffListParams) {
  return useQuery({
    queryKey: rbacKeys.staff(params),
    queryFn: () => rbacService.getStaff(params),
    staleTime: 60 * 1000,
  });
}

// ── Mutations: permissions ─────────────────────────────────────
export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePermissionInput) =>
      rbacService.createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
      toast.success("Permission created successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rbacService.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
      toast.success("Permission deleted successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Mutations: roles ───────────────────────────────────────────
export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleInput) => rbacService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      toast.success("Role created successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      toast.success("Role deleted successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useSyncRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) => rbacService.syncRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      toast.success("Role permissions updated successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Mutations: staff ───────────────────────────────────────────
export function useAssignStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      staffId,
      roleId,
    }: {
      staffId: string;
      roleId: string | null;
    }) => rbacService.assignStaffRole(staffId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.staffs() });
      toast.success("Staff role assigned successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useOnboardStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardStaffInput) => rbacService.onboardStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.staffs() });
      toast.success("New staff onboarded — credentials sent via email.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
