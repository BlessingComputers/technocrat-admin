import { useMutation, useQueryClient } from "@tanstack/react-query";
import { preorderKeys } from "./preorder.queries";
import { preorderService } from "./preorder.service";
import type { CancelPreorderInput, Preorder, PreorderRefund } from "../types/preorders";

export function useCancelPreorder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelPreorderInput }) =>
      preorderService.cancel(id, input),
    onSuccess: async ({ preorder, refund }, { id }) => {
      client.setQueryData<Preorder>(preorderKeys.detail(id), (current) =>
        current ? { ...current, ...preorder, refund } : { ...preorder, refund },
      );
      await client.invalidateQueries({ queryKey: preorderKeys.all });
    },
    onError: async (_error, { id }) => {
      await client.invalidateQueries({ queryKey: preorderKeys.detail(id) });
    },
  });
}

export function useMarkPreorderRefunded(preorderId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (refundId: string) => preorderService.markRefunded(refundId),
    onSuccess: (refund: PreorderRefund) => {
      client.setQueryData<Preorder>(preorderKeys.detail(preorderId), (current) =>
        current ? { ...current, refund } : current,
      );
    },
    onError: async () => {
      await client.invalidateQueries({ queryKey: preorderKeys.detail(preorderId) });
    },
  });
}
