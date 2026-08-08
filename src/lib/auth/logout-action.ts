"use server";

import { cookies } from "next/headers";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  buildCookieHeader,
  clearedCookieNames,
} from "@/lib/auth/session-cookies";

/**
 * Ends the staff session: tells the backend to revoke it, then deletes the
 * local session cookies (including the legacy `sa*` names — see
 * `clearedCookieNames`). Server action; the browser's cookies are forwarded so
 * the backend can identify the session being revoked.
 *
 * Slimmed from the main app's `adminLogoutAction`: this app is staff-only, so
 * `clearedCookieNames()` takes no audience argument (ADR — see CONTEXT.md
 * "Session-cookie translation").
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());

  // Backend revocation is best-effort: an unreachable backend must never
  // strand the user in a session they can't end. Local cookies are cleared
  // no matter what happens here.
  let message: { message?: string } | null = null;
  try {
    const response = await fetch(API_ENDPOINTS.staffAuth.logout, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
      },
    });
    message = await response.json().catch(() => null);
    if (!response.ok) {
      console.warn(`[STAFF LOGOUT] Backend revoke returned ${response.status}`);
    }
  } catch (error) {
    console.error(
      "[STAFF LOGOUT] Backend revoke unreachable; clearing local session anyway:",
      error instanceof Error ? error.message : error,
    );
  }

  // Clear staff session cookies (includes the legacy SA cookies).
  for (const name of clearedCookieNames()) {
    cookieStore.delete(name);
  }

  return message;
}
