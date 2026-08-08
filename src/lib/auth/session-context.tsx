"use client";

import { createContext, useContext } from "react";
import type { StaffSession } from "@/lib/auth/permissions";

/**
 * The staff session React context lives in `lib/auth` (not in the auth feature)
 * on purpose: presentation-gating helpers that every feature uses —
 * `usePermissions`, `<PermissionGate>` — must read the session, and the boundary
 * rules forbid a feature importing another feature. By keeping the *context* in
 * `lib/auth`, those shared helpers (also in `lib/auth`) can consume it while the
 * data-fetching *provider* stays in `features/auth` (ARCHITECTURE.md: "feature
 * providers like SessionProvider stay in features/auth").
 *
 * This module is the context primitive only — `SessionProvider`
 * (features/auth) supplies the value. Reading happens via `useStaffSession`.
 */

export interface SessionContextValue {
  staffSession: StaffSession | null;
  isLoading: boolean;
  isError: boolean;
}

export const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function useStaffSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useStaffSession must be used within a SessionProvider");
  }
  return context;
}
