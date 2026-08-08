import { useQuery } from "@tanstack/react-query";
import type { StaffSession } from "@/lib/auth/permissions";
import { authService } from "./auth.service";

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
