/**
 * Centralized, validated, dependency-free environment access.
 *
 * ## The backend seam (ADR-0015)
 *
 * **`NEXT_PUBLIC_BACKEND_URL` is the only variable that names the backend.**
 * Everything else that needs a backend address is *derived* from it here:
 *
 * - `serverEnv().apiBaseUrl` → `<origin>/api` — the rewrite target, server
 *   fetches, and the upload proxy.
 * - `publicEnv.emergencyUnblockUrl` → `<origin>/internal/emergency-unblock`.
 * - the chat / WhatsApp sockets read the origin directly.
 *
 * Do not reintroduce a second host-bearing variable. Pointing this app at a
 * different backend — Technocrat's own, when it exists — must stay a one-line
 * change. See `docs/adr/0015-single-backend-origin-seam.md`.
 *
 * ## Two surfaces, kept apart on purpose (ADR-0003; MIGRATION Phase 2)
 *
 * - `publicEnv` — `NEXT_PUBLIC_*` only. Referenced as static
 *   `process.env.NEXT_PUBLIC_*` literals so Next inlines them into the client
 *   bundle. Safe to read in client OR server code.
 * - `serverEnv()` — server-only secrets (`GROQ_API_KEY`, `CLAUDE_API_KEY`) plus
 *   the derived backend base. Throws if accessed in the browser, so a server
 *   var can never leak into a client bundle. Call it lazily (it's a function)
 *   so validation fails fast at first server use rather than at module import.
 *
 * Dependency-free and import-free (no `@/` alias) so it's safe to import from
 * `next.config.ts` via a relative path too.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.development / .env.production (see the variable table ` +
        `in ARCHITECTURE.md) or the deploy platform's project settings.`,
    );
  }
  return value;
}

/**
 * The backend origin with any trailing slash removed, so derived paths never
 * produce a double slash. `undefined` when unset — `serverEnv()` is what turns
 * that into a hard failure; the sockets and the unblock widget degrade quietly
 * instead, exactly as they did before the seam was collapsed.
 */
const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "");

/** Public config — inlined at build, safe in any runtime. */
export const publicEnv = {
  /**
   * Browser-facing API base. Not part of the backend seam — it's a *path* on
   * our own origin (the ADR-0003 proxy), not a host. Overridable only for the
   * rare case of mounting the proxy somewhere other than `/api`.
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  /** Backend origin for non-proxied uses (sockets, asset URLs). THE seam. */
  backendUrl: backendOrigin,
  /** Emergency IP-unblock endpoint. Derived; degrades if the origin is unset. */
  emergencyUnblockUrl: backendOrigin
    ? `${backendOrigin}/internal/emergency-unblock`
    : undefined,
  /**
   * Escape hatch for the chat socket transport. Chat connects WebSocket-only by
   * default (see `chat-socket.ts`); set this to `"true"` to restore the
   * polling→websocket upgrade path without a code change.
   */
  socketPollingFallback: process.env.NEXT_PUBLIC_SOCKET_POLLING_FALLBACK === "true",
} as const;

export const isDev = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Hosts `next/image` is allowed to load from. Build-time only — Next bakes
 * `remotePatterns` into the build, so changing this needs a rebuild, not just
 * a restart. Defaults to the object storage + avatar hosts the shared backend
 * serves today; override when a different backend serves images elsewhere.
 */
const DEFAULT_IMAGE_HOSTS = [
  "technocratblessingcomputers.fra1.digitaloceanspaces.com",
  "lh3.googleusercontent.com",
  "res.cloudinary.com",
  "i.pravatar.cc",
];

interface ServerEnv {
  /**
   * Full backend base URL for server-side fetches + the `/api` rewrite.
   * Derived from `NEXT_PUBLIC_BACKEND_URL` — never its own variable (ADR-0015).
   */
  apiBaseUrl: string;
  /** Hostnames allowed in `next/image`'s `remotePatterns`. */
  imageHosts: string[];
  /** Groq key — primary provider for the AI smart-paste routes. Optional — the adapter validates it. */
  groqApiKey: string | undefined;
  /** Claude (Anthropic) key — rate-limit fallback for the smart-paste routes. Optional — the adapter validates it. */
  claudeApiKey: string | undefined;
}

/** Server-only config. Throws if read in the browser. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "serverEnv() was accessed in the browser. Server-only env vars " +
        "(GROQ_API_KEY, CLAUDE_API_KEY) must never be read in a " +
        "client component — use publicEnv for anything the client needs.",
    );
  }
  const origin = required(backendOrigin, "NEXT_PUBLIC_BACKEND_URL");
  const hosts = process.env.IMAGE_ASSET_HOSTS?.split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return {
    apiBaseUrl: `${origin}/api`,
    imageHosts: hosts?.length ? hosts : DEFAULT_IMAGE_HOSTS,
    groqApiKey: process.env.GROQ_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY,
  };
}
