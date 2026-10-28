import { useMutation, useQuery } from "@tanstack/react-query";
import type { StaffSession } from "@/lib/auth/permissions";
import { hardNavigate } from "@/lib/auth/hard-navigate";
import { logoutAction } from "@/lib/auth/logout-action";
import { authService } from "./auth.service";
import type { ResetPasswordDto } from "../types/auth";

export const authKeys = {
  all: ["auth"] as const,
  staffProfile: () => [...authKeys.all, "staffProfile"] as const,
};

/**
 * Client-side staff session. Seeded with `initialData` from the server-rendered
 * session (see `getStaffSessionServer`) so there's no loading flash, then
 * revalidated on the client. Never retries: a 401 here means "not logged in",
 * which the fetch client handles via its refresh-or-bounce cycle (ADR-0004).
 */
export function useStaffProfileQuery(options?: {
  initialData?: StaffSession | null;
}) {
  return useQuery({
    queryKey: authKeys.staffProfile(),
    queryFn: () => authService.getStaffProfileClient(),
    staleTime: 1000 * 60 * 5,
    retry: false,
    ...options,
  });
}

/** Email a reset link. The backend answers 200 whether or not the email exists. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}

/**
 * Set a new password from an emailed token. The backend revokes every session
 * for that staff member. If this browser still holds one, the proxy would
 * bounce /login to /, so clear the local cookies first, then full-load /login.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordDto) => authService.resetPassword(data),
    onSuccess: async () => {
      await logoutAction().catch(() => null);
      hardNavigate("/login?notice=password-reset");
    },
  });
}
