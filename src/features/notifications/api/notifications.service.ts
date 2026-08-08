import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { NotificationsPage, StaffNotification } from "../types/notification";

/**
 * Staff-notification data access (ticket A6). Unlike chat, these endpoints
 * are the `{ success: boolean, data }` envelope the shared client already
 * unwraps (README convention) — so `api.get<T>()` returns the inner payload
 * directly, no manual `.data` peel here.
 *
 * `GET /staff/notifications` is double-nested regardless: the client unwraps
 * the outer envelope, leaving `{ data: StaffNotification[], meta }` — the
 * inner `.data` still has to be read explicitly (README's `/admin/transactions`
 * caveat applies here too).
 */
export const notificationsService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsPage> => {
    const payload = await api.get<{
      data: StaffNotification[];
      meta: {
        total: number;
        unreadCount: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(API_ENDPOINTS.staffNotifications.list, {
      params: {
        page: params?.page,
        limit: params?.limit,
        unreadOnly: params?.unreadOnly ? "true" : undefined,
      },
    });
    return {
      notifications: payload.data,
      total: payload.meta.total,
      unreadCount: payload.meta.unreadCount,
      page: payload.meta.page,
      limit: payload.meta.limit,
      totalPages: payload.meta.totalPages,
    };
  },

  unreadCount: async (): Promise<number> => {
    const payload = await api.get<{ unreadCount: number }>(
      API_ENDPOINTS.staffNotifications.unreadCount,
    );
    return payload.unreadCount;
  },

  markRead: async (id: string): Promise<StaffNotification> =>
    api.patch<StaffNotification>(API_ENDPOINTS.staffNotifications.read(id)),

  markAllRead: async (): Promise<number> => {
    const payload = await api.patch<{ updated: number }>(
      API_ENDPOINTS.staffNotifications.readAll,
    );
    return payload.updated;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.staffNotifications.detail(id));
  },
};
