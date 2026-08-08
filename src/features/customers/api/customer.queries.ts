import { useQuery } from "@tanstack/react-query";
import { customerService } from "./customer.service";
import type {
  CustomerAnalyticsPeriod,
  CustomersListParams,
} from "../types/customers";

export const customerKeys = {
  all: ["customers"] as const,
  list: (params: CustomersListParams) =>
    [...customerKeys.all, "list", params] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
  orders: (id: string) => [...customerKeys.detail(id), "orders"] as const,
  invoices: (id: string) => [...customerKeys.detail(id), "invoices"] as const,
  analytics: (period: CustomerAnalyticsPeriod) =>
    [...customerKeys.all, "analytics", period] as const,
};

export function useCustomers(filters: CustomersListParams) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customerService.getAllCustomers(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * A customer's order history, recovered from the admin manual-orders list by
 * email (see `customerService.getCustomerOrders`). Keyed on the customer id so
 * it caches alongside the detail query and is enabled only once we have an email.
 */
export function useCustomerOrders(
  customer?: { id?: string; customerId?: string; email?: string } | null,
) {
  const id = customer?.id ?? customer?.email ?? "";
  return useQuery({
    queryKey: customerKeys.orders(id),
    queryFn: () => customerService.getCustomerOrders(customer ?? {}),
    enabled: !!customer?.email,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * A customer's invoice history (GET /v1/invoice/customer/:id). Keyed on the
 * customer UUID, enabled once we have one.
 */
export function useCustomerInvoices(customerId?: string) {
  return useQuery({
    queryKey: customerKeys.invoices(customerId ?? ""),
    queryFn: () => customerService.getCustomerInvoices(customerId ?? ""),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCustomerAnalytics(period: CustomerAnalyticsPeriod = "30d") {
  return useQuery({
    queryKey: customerKeys.analytics(period),
    queryFn: () => customerService.getAnalytics(period),
    staleTime: 1000 * 60 * 5,
  });
}
