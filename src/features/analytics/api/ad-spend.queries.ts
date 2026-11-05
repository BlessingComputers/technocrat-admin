import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import { analyticsKeys } from "./analytics.queries";
import { analyticsService } from "./analytics.service";
import type { AdSpendBody, DateWindow } from "../types/ad-spend";

export const adSpendKeys = {
  all: [...analyticsKeys.all, "ad-spend"] as const,
  list: (range: DateWindow) => [...adSpendKeys.all, range.from, range.to] as const,
};

export function useAdSpend(range: DateWindow) {
  return useQuery({
    queryKey: adSpendKeys.list(range),
    queryFn: () => analyticsService.listAdSpend(range),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateAdSpend() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: adSpendKeys.all });
}

export function useCreateAdSpend() {
  const invalidate = useInvalidateAdSpend();
  return useMutation({
    mutationFn: (body: AdSpendBody) => analyticsService.createAdSpend(body),
    onSuccess: () => {
      invalidate();
      toast.success("Spend logged");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't log the spend")),
  });
}

export function useUpdateAdSpend() {
  const invalidate = useInvalidateAdSpend();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<AdSpendBody> }) =>
      analyticsService.updateAdSpend(vars.id, vars.body),
    onSuccess: () => {
      invalidate();
      toast.success("Spend updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update the spend")),
  });
}

export function useDeleteAdSpend() {
  const invalidate = useInvalidateAdSpend();
  return useMutation({
    mutationFn: (id: string) => analyticsService.deleteAdSpend(id),
    onSuccess: () => {
      invalidate();
      toast.success("Spend deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete the spend")),
  });
}
