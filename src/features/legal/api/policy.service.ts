import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  PolicyVersion,
  PublishPolicyVersionInput,
  StorefrontPolicyText,
} from "../types/policy";

/**
 * Checkout policy registry access.
 *
 * These routes use the `ok()` helper (`{ success: true, data }`), which the
 * shared client unwraps — so everything here returns payloads directly, unlike
 * the tax service.
 */

const { policy } = API_ENDPOINTS;

export const policyService = {
  /**
   * The published version, or `null` when nothing has ever been published.
   *
   * The backend answers 404 for "none published yet", which is a state, not a
   * failure — the whole point of the screen is to fix it.
   */
  getCurrent: async (): Promise<PolicyVersion | null> => {
    try {
      return await api.get<PolicyVersion>(policy.current);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  list: () => api.get<PolicyVersion[]>(policy.versions),

  publish: (data: PublishPolicyVersionInput) =>
    api.post<PolicyVersion>(policy.versions, data),

  /**
   * The live storefront policy text, read through this app's own proxy — the
   * storefront is another origin and sends no CORS headers.
   */
  getStorefrontText: async (): Promise<StorefrontPolicyText> => {
    const res = await fetch("/api/admin/policy-text", { cache: "no-store" });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(
        body?.message ?? "Could not read the policy from the storefront.",
        res.status,
        body,
      );
    }
    return body as StorefrontPolicyText;
  },
};
