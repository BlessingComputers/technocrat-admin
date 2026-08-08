import { cookies } from "next/headers";
import { cache } from "react";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { StaffSession } from "@/lib/auth/permissions";
import { buildCookieHeader } from "@/lib/auth/session-cookies";

/**
 * Fetches the staff profile on the server using the request's cookies, so server
 * components get the session without a client-side loading flash. Wrapped in
 * React `cache` to dedupe within a single render.
 *
 * Server-side only: hits the backend directly via the full `API_BASE_URL`
 * (the same-origin `/api` proxy is for the browser — see ADR-0003).
 */
export const getStaffSessionServer = cache(
  async (): Promise<StaffSession | null> => {
    const cookieStore = await cookies();
    try {
      const cookieHeader = buildCookieHeader(cookieStore.getAll());

      const response = await fetch(API_ENDPOINTS.staffAuth.profile, {
        headers: {
          "x-client": "nextjs-ssr",
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 0, // never cache session data
        },
      });

      if (!response.ok) {
        // Log the status + body so a backend rejection (vs. missing session)
        // is diagnosable from Vercel logs instead of silently reading as
        // "unauthenticated".
        const body = await response.text().catch(() => "");
        console.error(
          `[STAFF SESSION] Profile fetch failed: ${response.status} ${body.slice(0, 300)}`,
        );
        return null;
      }

      const json = await response.json();
      const data = json?.data;
      if (!data) return null;

      const roleName: string = data.customRole?.name ?? data.role ?? "STAFF";
      const rawPermissions: {
        permission: { id: string; name: string; group?: string };
      }[] = data.customRole?.permissions ?? [];

      return {
        id: data.staffId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: { id: data.role ?? "STAFF", name: roleName },
        avatarUrl: data.avatarUrl,
        permissions: rawPermissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          group: rp.permission.group ?? rp.permission.name.split(":")[0],
        })),
      };
    } catch (error) {
      console.error("Error fetching staff session on server:", error);
      return null;
    }
  },
);
