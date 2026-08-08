/**
 * Centralized, validated, dependency-free environment access.
 *
 * Two surfaces, kept apart on purpose (ADR-0003; MIGRATION Phase 2):
 *
 * - `publicEnv` — `NEXT_PUBLIC_*` only. Referenced as static
 *   `process.env.NEXT_PUBLIC_*` literals so Next inlines them into the client
 *   bundle. Safe to read in client OR server code.
 * - `serverEnv()` — server-only secrets (`API_BASE_URL`, `GROQ_API_KEY`,
 *   `CLAUDE_API_KEY`). Throws
 *   if accessed in the browser, so a server var can never leak into a client
 *   bundle. Call it lazily (it's a function) so validation fails fast at first
 *   server use rather than at module import.
 *
 * Dependency-free and import-free (no `@/` alias) so it's safe to import from
 * `next.config.ts` via a relative path too.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local (local dev) or the Vercel project settings (deploy).`,
    );
  }
  return value;
}

/** Public config — inlined at build, safe in any runtime. */
export const publicEnv = {
  /** Browser-facing API base. Defaults to the same-origin proxy (ADR-0003). */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  /** Backend origin for non-proxied uses (e.g. asset URLs). Optional. */
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  /** Emergency IP-unblock endpoint. Optional — the feature degrades if unset. */
  emergencyUnblockUrl: process.env.NEXT_PUBLIC_EMERGENCY_UNBLOCK_URL,
  /**
   * Escape hatch for the chat socket transport. Chat connects WebSocket-only by
   * default (see `chat-socket.ts`); set this to `"true"` to restore the
   * polling→websocket upgrade path without a code change.
   */
  socketPollingFallback: process.env.NEXT_PUBLIC_SOCKET_POLLING_FALLBACK === "true",
} as const;

export const isDev = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";

interface ServerEnv {
  /** Full backend base URL for server-side fetches + the `/api` rewrite. */
  apiBaseUrl: string;
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
        "(API_BASE_URL, GROQ_API_KEY, CLAUDE_API_KEY) must never be read in a " +
        "client component — use publicEnv for anything the client needs.",
    );
  }
  return {
    apiBaseUrl: required(process.env.API_BASE_URL, "API_BASE_URL"),
    groqApiKey: process.env.GROQ_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY,
  };
}
