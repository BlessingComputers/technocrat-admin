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
 * (`{ status, message, data }`). The shared client unwraps it, so every method
 * returns the inner payload.
 *
 * Path params take the row's DB `id` (UUID). Every route requires
 * `salesNotifications:manage`; a 403 here means the caller lacks it.
 */

const { salesNotifications } = API_ENDPOINTS;

export const salesNotificationsService = {
  list: async () =>
    api.get<SalesNotificationEmail[]>(salesNotifications.emails),

  create: async (data: SalesNotificationEmailInput) =>
    api.post<SalesNotificationEmail>(salesNotifications.emails, data),

  update: async (id: string, data: SalesNotificationEmailUpdateInput) =>
    api.patch<SalesNotificationEmail>(salesNotifications.email(id), data),

  remove: async (id: string) =>
    api.delete<{ message: string }>(salesNotifications.email(id)),
};
