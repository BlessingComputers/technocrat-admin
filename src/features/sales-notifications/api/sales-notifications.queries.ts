import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesNotificationsService } from "./sales-notifications.service";
import type {
  SalesNotificationEmailInput,
  SalesNotificationEmailUpdateInput,
} from "../types/sales-notifications";

export const salesNotificationsKeys = {
  all: ["sales-notifications"] as const,
  emails: () => [...salesNotificationsKeys.all, "emails"] as const,
};

/**
 * The recipient list. There is no pagination on the backend — it returns every
 * row, newest first — so there's one key and no params.
 */
export function useSalesNotificationEmails() {
  return useQuery({
    queryKey: salesNotificationsKeys.emails(),
    queryFn: () => salesNotificationsService.list(),
  });
}

export function useCreateSalesNotificationEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SalesNotificationEmailInput) =>
      salesNotificationsService.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: salesNotificationsKeys.emails(),
      }),
  });
}

/**
 * Edit a recipient. Also carries the pause/resume toggle — `isActive: false`
 * keeps the row and stops the emails, which is why there's no separate
 * "deactivate" endpoint.
 */
export function useUpdateSalesNotificationEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: SalesNotificationEmailUpdateInput;
    }) => salesNotificationsService.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: salesNotificationsKeys.emails(),
      }),
  });
}

export function useDeleteSalesNotificationEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesNotificationsService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: salesNotificationsKeys.emails(),
      }),
  });
}
