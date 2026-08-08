"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { extractTokens, sessionCookieSpecs } from "@/lib/auth/session-cookies";

export type LoginState = {
  email: string;
  password: string;
  error: string | undefined;
  /**
   * Backend error code, surfaced so the client can react (e.g. `IP_BLOCKED`
   * triggers the EmergencyUnblock UI). Undefined for ordinary auth failures.
   */
  code?: string;
  redirectTo: string;
};

/**
 * Staff login server action. Authenticates against the backend directly (full
 * `API_BASE_URL`, server-side — ADR-0003), then writes the session cookies the
 * backend hands back. On success it `redirect()`s to `redirectTo`; on failure
 * it returns the form state with an `error` for the client to surface.
 *
 * Ported from the main app's `adminLoginAction`: the session-cookie helpers are
 * the staff-only no-argument variants, and the routes are root-relative
 * (`/` is the dashboard home, `/login`) since this app has no `/admin` prefix.
 */
export async function loginAction(
  state: LoginState | undefined,
  formData: FormData,
): Promise<LoginState | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo =
    (formData.get("redirectTo") as string) || state?.redirectTo || "/";

  if (!email?.trim())
    return { email, password, error: "Email is required", redirectTo };
  if (!password?.trim())
    return { email, password, error: "Password is required", redirectTo };

  let success = false;

  try {
    const response = await fetch(API_ENDPOINTS.staffAuth.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message =
        errorData?.message || errorData?.error || "Invalid email or password";
      return { email, password, error: message, code: errorData?.code, redirectTo };
    }

    const cookieStore = await cookies();
    const data = await response.json().catch(() => null);

    // Pull the staff tokens from the backend response (JSON payload, then
    // Set-Cookie headers override) and write the session cookies.
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    const tokens = extractTokens(data?.data, setCookieHeaders);

    if (tokens) {
      for (const spec of sessionCookieSpecs(tokens)) {
        cookieStore.set(spec.name, spec.value, spec.options);
      }
      success = true;
    }

    if (!success) {
      return {
        email,
        password,
        error: "Login failed: no session cookie received",
        redirectTo,
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      email,
      password,
      error: "Something went wrong. Please try again.",
      redirectTo,
    };
  }

  if (success) redirect(redirectTo);
}
