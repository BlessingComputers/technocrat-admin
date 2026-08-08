"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSocketToken } from "@/lib/api/socket-token";

/** Base64URL-decode a JWT segment (no signature check — UI identity only). */
function b64urlDecode(segment: string): string {
  let s = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  return atob(s);
}

/** Read the `sub` (staff UUID) claim from an unverified JWT. */
function decodeSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(b64urlDecode(payload)) as { sub?: unknown };
    return typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

/**
 * The current staff member's UUID — the identity the backend keys conversation
 * ownership on (`assignedStaffId`, message `senderId`, presence), for both live
 * chat and the WhatsApp inbox.
 *
 * The staff *session* only carries the human `staffId` code (the
 * `/staff/profile` endpoint doesn't return the UUID), so comparing
 * `assignedStaffId` against `session.id` never matches — a staffer's own
 * conversations read as "someone else's". The socket-handshake JWT's `sub` claim
 * IS that UUID (it equals `Staff.id`), and the app already fetches this token,
 * so we decode it here for the identity match. Cached for the session — the UUID
 * is stable across token rotations.
 *
 * Lives in `lib/` because more than one feature needs it and features may not
 * import from each other.
 *
 * TODO: once the backend exposes the staff `id` on `/staff/profile`, source this
 * from the session instead and drop the JWT decode.
 */
export function useCurrentStaffId(): string | null {
  const { data } = useQuery({
    queryKey: ["staff", "current-uuid"],
    queryFn: async () => {
      const token = await fetchSocketToken();
      return token ? decodeSub(token) : null;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
  return data ?? null;
}
