import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { couponService } from "./coupons.service";
import {
  COUPON_STATUSES,
  type Coupon,
  type CouponStatus,
  type CouponsListParams,
  type CouponsPage,
  type CreateCouponInput,
  type UpdateCouponInput,
} from "../types/coupons";

export const couponKeys = {
  all: ["coupons"] as const,
  list: (params: CouponsListParams) =>
    [...couponKeys.all, "list", params] as const,
  byId: (id: string) => [...couponKeys.all, "id", id] as const,
  byCode: (code: string) => [...couponKeys.all, "code", code] as const,
  counts: () => [...couponKeys.all, "counts"] as const,
  count: (status: CouponStatus) => [...couponKeys.counts(), status] as const,
};

/**
 * Whether an edit route's segment is a row UUID or a customer-facing code.
 *
 * Codes are `[A-Z0-9]{3,50}` and so can never contain a hyphen, which makes
 * the two unambiguous — there is no code a UUID could be mistaken for, or the
 * other way round.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isCouponId = (ref: string): boolean => UUID_RE.test(ref);

/**
 * Coupons are reference data, not a worked queue, so this sits closer to the
 * customers list (five minutes) than to pre-orders (thirty seconds). Two
 * minutes is the compromise: a live coupon costing money is the thing this
 * screen exists to catch, and staff disabling one want to watch it go.
 */
const COUPONS_STALE_MS = 120_000;

export function useCoupons(params: CouponsListParams) {
  return useQuery({
    queryKey: couponKeys.list(params),
    queryFn: () => couponService.list(params),
    staleTime: COUPONS_STALE_MS,
  });
}

/**
 * One coupon by code. The fallback path for the edit route, kept so links
 * shaped `/coupons/SAVE20/edit` — shared in chat, bookmarked, or sitting in
 * someone's history from before the by-id route existed — still resolve. See
 * `couponService.findByCode` for the scan it costs.
 *
 * `null` (no such code) is a legitimate resolved value, not an error, so the
 * view distinguishes "still loading" from "resolved to nothing" by checking
 * `isPending` before `data === null`.
 */
export function useCouponByCode(code: string) {
  return useQuery({
    queryKey: couponKeys.byCode(code),
    queryFn: () => couponService.findByCode(code),
    enabled: !!code,
    staleTime: COUPONS_STALE_MS,
  });
}

/**
 * One coupon by UUID, through `GET /admin/coupons/{id}`. The path the list
 * links to, and the reliable one — a single row, no scan, no substring ceiling.
 *
 * `null` on a 404, for the same reason as `useCouponByCode`.
 */
export function useCouponById(id: string) {
  return useQuery({
    queryKey: couponKeys.byId(id),
    queryFn: () => couponService.getById(id),
    enabled: !!id,
    staleTime: COUPONS_STALE_MS,
  });
}

/**
 * The edit route's lookup, taking whichever of the two the URL carries.
 *
 * Both branches are declared every render and one is disabled, rather than
 * calling a hook conditionally. The disabled one never fires a request.
 */
export function useCouponByRef(ref: string) {
  const byId = useCouponById(isCouponId(ref) ? ref : "");
  const byCode = useCouponByCode(isCouponId(ref) ? "" : ref);
  return isCouponId(ref) ? byId : byCode;
}

/**
 * How many coupons sit at each stored status, for the filter chips.
 *
 * There is no counts endpoint and the list's `total` only describes the filter
 * currently applied, so this is one `limit: 1` request per status, reading
 * `total` off each. Three tiny requests, and they answer the question the
 * screen exists for before you have read a single row: how many codes are live
 * right now.
 *
 * `search` is deliberately not threaded through — these describe the whole
 * catalogue, and a chip row that silently rescoped itself to the current
 * search would make "Active 3" mean two different things on two screens.
 */
export function useCouponCounts() {
  const results = useQueries({
    queries: COUPON_STATUSES.map((status) => ({
      queryKey: couponKeys.count(status),
      queryFn: () => couponService.list({ status, page: 1, limit: 1 }),
      staleTime: COUPONS_STALE_MS,
      select: (page: CouponsPage) => page.total,
    })),
  });

  const counts = {} as Record<CouponStatus, number | undefined>;
  COUPON_STATUSES.forEach((status, i) => {
    counts[status] = results[i]?.data;
  });

  return {
    counts,
    /** Total across every status — the "All" chip. */
    total: results.every((r) => typeof r.data === "number")
      ? results.reduce((sum, r) => sum + (r.data ?? 0), 0)
      : undefined,
    isLoading: results.some((r) => r.isLoading),
    isFetching: results.some((r) => r.isFetching),
    refetch: () => results.forEach((r) => void r.refetch()),
  };
}

/**
 * Everything a write touches: every list page, every chip count, and every
 * by-code lookup.
 *
 * Blanket invalidation rather than surgical cache patching, on purpose. A new
 * coupon lands at the top of an unfiltered list but nowhere in a filtered one;
 * a status flip moves a row between two chips and out of the filter it is
 * being read under. Writing the row into the page it is currently on would
 * leave it sitting in a list it no longer belongs to, which is worse than a
 * refetch of three small requests.
 */
function useInvalidateCoupons() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: couponKeys.all });
  };
}

export function useCreateCoupon() {
  const invalidate = useInvalidateCoupons();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCouponInput) => couponService.create(input),
    onSuccess: (created: Coupon) => {
      // Seed both lookups so "Edit" straight after creating doesn't re-fetch a
      // row we were just handed. Matters most for a server-generated code,
      // where the creator has not seen it yet.
      queryClient.setQueryData(couponKeys.byId(created.id), created);
      queryClient.setQueryData(couponKeys.byCode(created.code), created);
      invalidate();
    },
  });
}

export function useUpdateCoupon() {
  const invalidate = useInvalidateCoupons();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCouponInput }) =>
      couponService.update(id, input),
    onSuccess: (updated: Coupon) => {
      queryClient.setQueryData(couponKeys.byId(updated.id), updated);
      queryClient.setQueryData(couponKeys.byCode(updated.code), updated);
      invalidate();
    },
  });
}
