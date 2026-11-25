import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { PRICE_AGE_QUERY_KEY } from "@/lib/utils/price-age";
import { fxService } from "./fx.service";
import type { FxLinkInput } from "../types/fx";

export const fxKeys = {
  all: ["fx"] as const,
  coverage: () => [...fxKeys.all, "coverage"] as const,
  history: (page: number) => [...fxKeys.all, "history", page] as const,
  standingLinks: () => [...fxKeys.all, "standing-links"] as const,
};

/**
 * List caches a link change makes stale. Written as key roots, not imported:
 * features may not import each other (ARCHITECTURE.md rule 2). They match
 * `productKeys.lists()` and `partKeys.lists()`.
 */
const LINKED_LIST_KEYS = [
  ["products", "list"],
  ["parts", "list"],
] as const;

export function useFxCoverage() {
  return useQuery({
    queryKey: fxKeys.coverage(),
    queryFn: () => fxService.getCoverage(),
    staleTime: 60_000,
  });
}

export function useFxHistory(page: number) {
  return useQuery({
    queryKey: fxKeys.history(page),
    queryFn: () => fxService.getHistory(page),
    placeholderData: keepPreviousData,
  });
}

export function useFxStandingLinks() {
  return useQuery({
    queryKey: fxKeys.standingLinks(),
    queryFn: () => fxService.getStandingLinks(),
  });
}

// Taxonomy rarely changes within a session.
const TAXONOMY_STALE_MS = 5 * 60_000;

export function useFxCategories() {
  return useQuery({
    queryKey: [...fxKeys.all, "categories"],
    queryFn: () => fxService.getCategories(),
    staleTime: TAXONOMY_STALE_MS,
  });
}

export function useFxBrands() {
  return useQuery({
    queryKey: [...fxKeys.all, "brands"],
    queryFn: () => fxService.getBrands(),
    staleTime: TAXONOMY_STALE_MS,
  });
}

export function useSetFxLinked() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FxLinkInput) => fxService.setLinked(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fxKeys.coverage() });
      queryClient.invalidateQueries({ queryKey: fxKeys.standingLinks() });
      // The price-age card leaves linked items out, so its count moves too.
      queryClient.invalidateQueries({ queryKey: PRICE_AGE_QUERY_KEY });
      for (const key of LINKED_LIST_KEYS) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useDeleteFxStandingLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fxService.deleteStandingLink(id),
    // Nothing is unlinked, so only the standing-link list changes.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: fxKeys.standingLinks() }),
  });
}
