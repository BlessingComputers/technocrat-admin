import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/error";
import type {
  Coupon,
  CouponsListParams,
  CouponsPage,
  CreateCouponInput,
  UpdateCouponInput,
} from "../types/coupons";

const { coupons } = API_ENDPOINTS;

/**
 * No manual envelope peel here, deliberately — same reasoning as
 * `preorder.service.ts`. These routes sit on the consolidated admin dashboard
 * controller, which answers through its own `ok()` helper (`{ success: true,
 * data }`, a BOOLEAN `success`), and the shared client's `unwrapEnvelope`
 * recognises that shape and strips it (ADR-0007). Modules answering through
 * `ResponseUtil` send a STRING `status` instead, which `isEnvelope` does not
 * match, and those services peel `.data` by hand (see `tax.service.ts`). Don't
 * copy that peel in here — it would strip a level already stripped.
 */

/** Drop empty/undefined params so the backend's enum validation doesn't choke. */
function cleanParams(
  params: CouponsListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined && value !== null) {
      out[key] = value as string | number;
    }
  }
  return out;
}

/** The backend's own cap on `limit` (`limit(100, 20)` in `Admin.schema.ts`). */
const MAX_LIMIT = 100;

export const couponService = {
  list: (params: CouponsListParams): Promise<CouponsPage> =>
    api.get<CouponsPage>(coupons.base, { params: cleanParams(params) }),

  /**
   * One coupon, by its UUID. The reliable single-row read, and the one the
   * edit route uses whenever it is given an id.
   *
   * Added to the backend in `b2661a1`; its own docs say it exists "so it no
   * longer has to fake a single-record lookup with
   * `GET /coupons?search=<code>&limit=100`" — which is precisely what
   * `findByCode` below still has to do.
   *
   * Returns `null` on a 404 rather than throwing, to match `findByCode`: "no
   * such coupon" is a state the edit view renders, not an error it reports.
   */
  getById: async (id: string): Promise<Coupon | null> => {
    try {
      return await api.get<Coupon>(coupons.detail(id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  /**
   * One coupon, by the code customers type.
   *
   * Kept, though `getById` now exists, because `/coupons/SAVE20/edit` links
   * were shareable and are still in bookmarks and chat history. The list links
   * by id now, so this is the fallback path rather than the main one.
   *
   * It remains a scan, and it is worth knowing why that is not free. There is
   * no by-code endpoint, so this lists up to 100 rows matching a
   * case-insensitive `contains` and picks the exact match. Two consequences:
   * `SAVE2` also returns `SAVE20`, hence the exact, case-sensitive comparison
   * on the way out; and a code sharing a substring with more than 100 others
   * could fall outside the page and read as "no such code". Neither is likely
   * at our catalogue size, and both go away if a by-code route ever ships.
   *
   * Returns `null` rather than throwing on a miss.
   */
  findByCode: async (code: string): Promise<Coupon | null> => {
    const page = await couponService.list({ search: code, limit: MAX_LIMIT });
    return page.data.find((coupon) => coupon.code === code) ?? null;
  },

  /**
   * Mint a coupon. SUPER_ADMIN only.
   *
   * Omit `code` to have the server generate a unique 8-character one (it
   * excludes 0/O and 1/I — the characters a customer misreads off a banner).
   * A supplied code that collides comes back 409 with the backend's own
   * message naming the code.
   *
   * Returns the created row, so the caller can seed the list cache.
   */
  create: (input: CreateCouponInput): Promise<Coupon> =>
    api.post<Coupon>(coupons.base, input),

  /**
   * Partial update. Send only what changed — the backend runs its cross-field
   * checks (PERCENTAGE ≤ 100, `expiresAt` after `startsAt`) against the MERGED
   * state, so a lone `discountValue` is still validated against the row's
   * existing `discountType`.
   *
   * ⚠️ Never send `expiresAt: null` to clear an expiry. The backend parses it
   * with `z.coerce.date()`, which turns `null` into 1970-01-01 rather than
   * rejecting it; that then fails the "after startsAt" check and comes back as
   * a confusing 400. There is no way to un-expire a coupon through this API —
   * disable it and mint a fresh one.
   *
   * This is also the only stop button: `status: "DISABLED"` kills a coupon
   * immediately. There is no DELETE, which is correct — the row is referenced
   * by `coupon_usages` and by every order that redeemed it.
   */
  update: (id: string, input: UpdateCouponInput): Promise<Coupon> =>
    api.patch<Coupon>(coupons.update(id), input),
};
