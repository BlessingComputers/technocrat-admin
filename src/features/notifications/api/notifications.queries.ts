import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import { notificationKeys } from "@/lib/api/notification-keys";
import { notificationsService } from "./notifications.service";

export { notificationKeys };

/** Bell dropdown contents. Polled as a safety net; the socket refresh (A6
 * commit 6) is the fast path. */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationsService.list({ limit: 20 }),
    enabled,
    refetchInterval: 60_000,
  });
}

/** Bell badge count — its own lightweight endpoint (README pattern doc). */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't mark that as read"));
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't mark all as read"));
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't delete that notification"));
    },
  });
}
