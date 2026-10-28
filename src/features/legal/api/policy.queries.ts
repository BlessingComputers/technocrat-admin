import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { policyService } from "./policy.service";
import type { PublishPolicyVersionInput } from "../types/policy";

export const policyKeys = {
  all: ["policy"] as const,
  current: () => [...policyKeys.all, "current"] as const,
  versions: () => [...policyKeys.all, "versions"] as const,
  storefrontText: () => [...policyKeys.all, "storefront-text"] as const,
};

export function useCurrentPolicy() {
  return useQuery({
    queryKey: policyKeys.current(),
    queryFn: () => policyService.getCurrent(),
  });
}

export function usePolicyVersions() {
  return useQuery({
    queryKey: policyKeys.versions(),
    queryFn: () => policyService.list(),
  });
}

/**
 * The storefront text, fetched when the publish panel opens.
 *
 * Never cached beyond the session: it is the input to a legal record, and a
 * stale copy would archive words the page no longer shows.
 */
export function useStorefrontPolicyText(enabled: boolean) {
  return useQuery({
    queryKey: policyKeys.storefrontText(),
    queryFn: () => policyService.getStorefrontText(),
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
}

export function usePublishPolicyVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PublishPolicyVersionInput) =>
      policyService.publish(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
    },
  });
}
