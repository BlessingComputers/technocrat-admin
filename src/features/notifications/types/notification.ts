import type { components } from "@/types/api";

/**
 * The backend row, straight from codegen (ADR-0006). `type` is a closed enum
 * on the backend but only two `entityType` values are populated today — see
 * the resolver for how an unresolvable notification degrades.
 */
export type StaffNotification = components["schemas"]["StaffNotification"];

export interface NotificationsPage {
  notifications: StaffNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
