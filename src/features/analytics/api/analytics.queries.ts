import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { getErrorMessage } from "@/lib/api/error-message";
import { analyticsService } from "./analytics.service";
import type { AdminKpiParams } from "../types/analytics";
import type {
  UploaderAnalyticsParams,
  UploaderItemsParams,
} from "../types/upload-analytics";
import type { AnalyticsPeriodParams } from "../types/chart-analytics";

export const analyticsKeys = {
  all: ["analytics"] as const,
  kpis: (params?: AdminKpiParams) =>
    [...analyticsKeys.all, "kpis", params] as const,
  staff: (id?: string) => [...analyticsKeys.all, "staff", id] as const,
  recentOrders: (limit: number) =>
    [...analyticsKeys.all, "recent-orders", limit] as const,
  uploaders: (params: UploaderAnalyticsParams) =>
    [...analyticsKeys.all, "uploaders", params] as const,
  uploaderProducts: (params: UploaderItemsParams) =>
    [...analyticsKeys.all, "uploader-products", params] as const,
  uploaderParts: (params: UploaderItemsParams) =>
    [...analyticsKeys.all, "uploader-parts", params] as const,
  revenue: (params?: AnalyticsPeriodParams) =>
    [...analyticsKeys.all, "revenue", params] as const,
  orders: (params?: AnalyticsPeriodParams) =>
    [...analyticsKeys.all, "orders", params] as const,
  products: () => [...analyticsKeys.all, "products"] as const,
  customers: (params?: AnalyticsPeriodParams) =>
    [...analyticsKeys.all, "customers", params] as const,
};

/**
 * Super-admin chart queries. All gated to super admins (the endpoints are
 * SUPER_ADMIN-only) and keep prior data while a new period refetches so the
 * charts don't flash empty on a filter change.
 */
export function useRevenueAnalytics(params?: AnalyticsPeriodParams) {
  const { staffSession } = useStaffSession();
  const superAdmin = isSuperAdmin(staffSession);

  return useQuery({
    queryKey: analyticsKeys.revenue(params),
    queryFn: () => analyticsService.getRevenueAnalytics(params),
    enabled: !!staffSession && superAdmin,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}

export function useOrderAnalytics(params?: AnalyticsPeriodParams) {
  const { staffSession } = useStaffSession();
  const superAdmin = isSuperAdmin(staffSession);

  return useQuery({
    queryKey: analyticsKeys.orders(params),
    queryFn: () => analyticsService.getOrderAnalytics(params),
    enabled: !!staffSession && superAdmin,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}

export function useProductAnalytics() {
  const { staffSession } = useStaffSession();
  const superAdmin = isSuperAdmin(staffSession);

  return useQuery({
    queryKey: analyticsKeys.products(),
    queryFn: () => analyticsService.getProductAnalytics(),
    enabled: !!staffSession && superAdmin,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomerAnalytics(params?: AnalyticsPeriodParams) {
  const { staffSession } = useStaffSession();
  const superAdmin = isSuperAdmin(staffSession);

  return useQuery({
    queryKey: analyticsKeys.customers(params),
    queryFn: () => analyticsService.getCustomerAnalytics(params),
    enabled: !!staffSession && superAdmin,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}

/** Super-admin live KPIs. Gated to super admins; uncached; keeps prior data while refetching. */
export function useAdminDashboardKpis(params?: AdminKpiParams) {
  const { staffSession } = useStaffSession();
  const superAdmin = isSuperAdmin(staffSession);

  // For a custom period, wait until both ends of the range are set.
  const isCustom = params?.period === "custom";
  const hasCustomDates = !!params?.from && !!params?.to;
  const enabled = !!staffSession && superAdmin && (!isCustom || hasCustomDates);

  return useQuery({
    queryKey: analyticsKeys.kpis(params),
    queryFn: () => analyticsService.getAdminDashboardKpis(params),
    enabled,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

/** Per-staff dashboard (defaults to the current user). */
export function useStaffDashboard(staffId?: string) {
  const { staffSession } = useStaffSession();
  const id = staffId || staffSession?.id;

  return useQuery({
    queryKey: analyticsKeys.staff(id),
    queryFn: () => analyticsService.getStaffDashboard(id as string),
    enabled: !!staffSession && !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/** Recent orders for the dashboard widget. */
export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: analyticsKeys.recentOrders(limit),
    queryFn: () => analyticsService.getRecentOrders(limit),
    staleTime: 1000 * 60 * 5,
  });
}

/** Per-uploader upload analytics vs daily target. Requires `products:read`. */
export function useUploaderAnalytics(params: UploaderAnalyticsParams) {
  const { staffSession } = useStaffSession();

  return useQuery({
    queryKey: analyticsKeys.uploaders(params),
    queryFn: () => analyticsService.getUploaderAnalytics(params),
    enabled: !!staffSession && !!params.startDate && !!params.endDate,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

/** One uploader's products within a date window (drill-down). */
export function useUploaderProducts(
  params: UploaderItemsParams,
  enabled = true,
) {
  const { staffSession } = useStaffSession();

  return useQuery({
    queryKey: analyticsKeys.uploaderProducts(params),
    queryFn: () => analyticsService.getUploaderProducts(params),
    enabled: !!staffSession && enabled && !!params.staffId,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

/** One uploader's parts within a date window (drill-down). */
export function useUploaderParts(params: UploaderItemsParams, enabled = true) {
  const { staffSession } = useStaffSession();

  return useQuery({
    queryKey: analyticsKeys.uploaderParts(params),
    queryFn: () => analyticsService.getUploaderParts(params),
    enabled: !!staffSession && enabled && !!params.staffId,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

/** Set/update a staff member's daily upload target (SUPER_ADMIN). */
export function useSetUploadTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { staffId: string; dailyTarget: number; note?: string }) =>
      analyticsService.setUploadTarget(vars.staffId, {
        dailyTarget: vars.dailyTarget,
        note: vars.note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...analyticsKeys.all, "uploaders"],
      });
      toast.success("Daily target updated");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to update target")),
  });
}

/** Remove a staff member's custom target — reverts to the global default. */
export function useDeleteUploadTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffId: string) =>
      analyticsService.deleteUploadTarget(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...analyticsKeys.all, "uploaders"],
      });
      toast.success("Target reset to default");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to reset target")),
  });
}
