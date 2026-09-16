import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  SalesNotificationEmail,
  SalesNotificationEmailInput,
  SalesNotificationEmailUpdateInput,
} from "../types/sales-notifications";

/**
 * Sales-notification recipient data access.
 *
 * These routes answer with the backend's `ResponseUtil` envelope
 * (`{ status, message, data }`, a STRING `status`). The shared admin client
 * only unwraps a BOOLEAN `success` envelope, so it leaves these wrapped — we
 * peel `.data` here, exactly as the tax service does.
 *
 * Path params take the row's DB `id` (UUID). Every route requires
 * `salesNotifications:manage`; a 403 here means the caller lacks it.
 */

const { salesNotifications } = API_ENDPOINTS;

/** Peel the `ResponseUtil` envelope the shared client leaves intact. */
function unwrap<T>(root: unknown): T {
  return (
    root && typeof root === "object" && "data" in root
      ? (root as { data: T }).data
      : root
  ) as T;
}

export const salesNotificationsService = {
  list: async () =>
    unwrap<SalesNotificationEmail[]>(await api.get(salesNotifications.emails)),

  create: async (data: SalesNotificationEmailInput) =>
    unwrap<SalesNotificationEmail>(
      await api.post(salesNotifications.emails, data),
    ),

  update: async (id: string, data: SalesNotificationEmailUpdateInput) =>
    unwrap<SalesNotificationEmail>(
      await api.patch(salesNotifications.email(id), data),
    ),

  remove: async (id: string) =>
    unwrap<{ message: string }>(await api.delete(salesNotifications.email(id))),
};
