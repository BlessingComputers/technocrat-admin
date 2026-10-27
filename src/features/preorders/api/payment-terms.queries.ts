import { useMutation, useQueryClient } from "@tanstack/react-query";
import { preorderKeys } from "./preorder.queries";
import { preorderService } from "./preorder.service";
import type { ExtendPaymentDeadlineInput, Preorder, PreorderPaymentSummary, RecordHandoffCollectionInput, RequestBalanceInput, RevisePaymentTermsInput } from "../types/preorders";

function useTermsMutation<T extends { preorderId: string }>(
  mutationFn: (input: T) => Promise<PreorderPaymentSummary>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (paymentSummary, { preorderId }) => {
      client.setQueryData<Preorder>(preorderKeys.detail(preorderId), (current) =>
        current ? { ...current, paymentSummary } : current,
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: preorderKeys.paymentHistory(preorderId) }),
        client.invalidateQueries({ queryKey: [...preorderKeys.all, "list"] }),
      ]);
    },
    onError: async (_error, { preorderId }) => {
      await client.invalidateQueries({ queryKey: preorderKeys.detail(preorderId) });
    },
  });
}

export function useRevisePaymentTerms() {
  return useTermsMutation(({ preorderId, input }: { preorderId: string; input: RevisePaymentTermsInput }) =>
    preorderService.revisePaymentTerms(preorderId, input),
  );
}

export function useExtendPaymentDeadline() {
  return useTermsMutation(({ requestId, input }: { preorderId: string; requestId: string; input: ExtendPaymentDeadlineInput }) =>
    preorderService.extendPaymentDeadline(requestId, input),
  );
}

export function useRequestPreorderBalance() {
  return useTermsMutation(({ preorderId, input }: { preorderId: string; input: RequestBalanceInput }) =>
    preorderService.requestBalance(preorderId, input),
  );
}

export function useRecordHandoffCollection() {
  return useTermsMutation((request: {
    preorderId: string;
    requestId: string;
    input: RecordHandoffCollectionInput;
  }) => preorderService.recordHandoffCollection(request.requestId, request.input));
}
