/**
 * Shared LLM adapter for the AI smart-paste parsers (products + parts).
 *
 * Two providers, both over plain REST (no SDK, matching the project's
 * dependency-light convention). The `ChatCompleter` seam keeps prompt-building
 * and response-parsing pure and testable: production wires in
 * `createFallbackCompleter`, tests pass a fake.
 *
 * Routing — Groq primary, Claude fallback (see `createFallbackCompleter`):
 * - Groq (`llama-3.3-70b`) is free/cheap and fast, but rate-limited. It's tried
 *   first. On a 429 it returns a `retry-after` telling us when its limit clears;
 *   we park it until then (a shared in-memory circuit breaker) and route to
 *   Claude meanwhile, then optimistically re-try Groq once the deadline passes.
 * - Claude (Haiku 4.5, `createClaudeCompleter`) is paid but reliable, and adds
 *   Structured Outputs (`json_schema`) so its reply can't be malformed JSON and
 *   follows the extraction rules more closely. It carries rate-limit windows and
 *   is the safety net. Haiku keeps cost low ($1 / $5 per 1M tokens) vs Sonnet/Opus.
 *
 * Either provider's raw text still passes through the parsers' normalize/validate
 * passes, which enforce referential checks (a subcategory that belongs to its
 * category, an ID that exists in the provided lists) that a schema can't express.
 */

import { serverEnv } from "@/config/env";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/** The seam: turn chat messages into the model's reply content. */
export type ChatCompleter = (messages: ChatMessage[]) => Promise<string>;

/** Carries the HTTP status the route should surface for a parse failure. */
export class AiParseError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AiParseError";
    this.status = status;
  }
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const CLAUDE_MODEL = "claude-haiku-4-5";
/**
 * Output ceiling. Haiku emits the whole products/parts array in one shot; 16k
 * covers large pastes while staying well under request-timeout limits for a
 * non-streaming call. If a very large batch ever truncates (`stop_reason:
 * "max_tokens"`), the JSON won't parse and the route surfaces a retry — split
 * the paste, or move this adapter to streaming.
 */
const MAX_TOKENS = 16000;

export interface ClaudeCompleterOptions {
  /**
   * JSON Schema the reply must satisfy (Structured Outputs). Objects need
   * `additionalProperties: false` and should list every property in `required`
   * (use nullable types, e.g. `["string", "null"]`, for optional fields).
   */
  schema: Record<string, unknown>;
}

/**
 * Build the production `ChatCompleter` for a given output schema. Splits the
 * system message out of `messages` (Anthropic takes `system` separately and only
 * accepts user/assistant roles in `messages`), constrains the reply with
 * Structured Outputs, and caches the static system prompt.
 */
export function createClaudeCompleter(
  options: ClaudeCompleterOptions,
): ChatCompleter {
  return async (messages) => {
    const apiKey = serverEnv().claudeApiKey;
    if (!apiKey) {
      throw new AiParseError("CLAUDE_API_KEY not configured in .env.local", 500);
    }

    // Anthropic wants the system prompt as its own field; only user/assistant
    // roles are allowed inside `messages`.
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => ({ role: "user" as const, content: m.content }));

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0,
        // Cache the static system prompt so repeat pastes in a bulk-upload
        // session pay ~0.1x for it instead of full price on every call.
        system: [
          { type: "text", text: system, cache_control: { type: "ephemeral" } },
        ],
        messages: userMessages,
        // Structured Outputs: the reply is guaranteed to match this schema.
        output_config: {
          format: { type: "json_schema", schema: options.schema },
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anthropic API Error:", response.status, errorBody);
      throw new AiParseError(
        `AI service error (${response.status}): ${response.statusText}`,
        response.status,
      );
    }

    const data = await response.json();
    // A safety refusal returns HTTP 200 with no text block — surface it clearly
    // rather than as an empty-JSON parse failure.
    if (data?.stop_reason === "refusal") {
      throw new AiParseError("AI declined to parse this input", 422);
    }
    // With Structured Outputs the first text block holds the schema-valid JSON.
    const content = data?.content?.find(
      (b: { type?: string }) => b?.type === "text",
    )?.text;
    if (!content) {
      throw new AiParseError("AI returned an empty response", 500);
    }
    return content;
  };
}

// ---------------------------------------------------------------------------
// Groq (primary provider) + circuit breaker + fallback routing
// ---------------------------------------------------------------------------

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/** 429 with no parsable `retry-after` — park Groq this long before retrying. */
const GROQ_DEFAULT_RETRY_MS = 60_000;
/** Transient Groq failure (5xx / network) — brief park so we don't hammer it. */
const GROQ_ERROR_COOLDOWN_MS = 30_000;

/**
 * Shared circuit-breaker state. Groq's rate limit is per-API-key, so ALL parsers
 * (products + parts) gate on one timestamp — epoch ms until which Groq is parked;
 * 0 means "try Groq". In-memory is correct here: the app runs as a single
 * long-lived PM2 process (`npm run restart`), so this persists across requests.
 * A deploy resets it (worst case: one wasted 429). On serverless you'd move this
 * to a shared store (e.g. Redis) instead.
 */
let groqBlockedUntil = 0;

/**
 * Read Groq's reset hint from a 429 so we retry no sooner than it allows.
 * `retry-after` is seconds (Groq's usual form) or an HTTP date; null if absent.
 */
function parseRetryAfterMs(headers: Headers): number | null {
  const raw = headers.get("retry-after");
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

/**
 * Groq adapter. Uses the OpenAI-compatible endpoint with `json_object` (Groq's
 * general JSON mode). Arms the shared breaker on failure so future requests skip
 * a provider we know is unavailable: a 429 parks Groq until its `retry-after`;
 * a transient 5xx/network error parks it briefly; other 4xx (a per-request
 * problem, not an outage) don't arm the breaker. Always throws on failure — the
 * fallback wrapper turns that into a Claude call.
 */
async function groqComplete(messages: ChatMessage[]): Promise<string> {
  const apiKey = serverEnv().groqApiKey;
  if (!apiKey) {
    throw new AiParseError("GROQ_API_KEY not configured in .env.local", 500);
  }

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });
  } catch (err) {
    groqBlockedUntil = Date.now() + GROQ_ERROR_COOLDOWN_MS;
    throw new AiParseError(
      `Groq unreachable: ${(err as Error).message}`,
      503,
    );
  }

  if (response.status === 429) {
    const wait = parseRetryAfterMs(response.headers) ?? GROQ_DEFAULT_RETRY_MS;
    groqBlockedUntil = Date.now() + wait;
    console.warn(
      `Groq rate-limited (429); parking for ${Math.round(wait / 1000)}s, ` +
        "routing to Claude.",
    );
    throw new AiParseError("Groq rate-limited", 429);
  }
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Groq API Error:", response.status, errorBody);
    if (response.status >= 500) {
      groqBlockedUntil = Date.now() + GROQ_ERROR_COOLDOWN_MS;
    }
    throw new AiParseError(`Groq error (${response.status})`, response.status);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new AiParseError("Groq returned an empty response", 500);
  return content;
}

/**
 * Production ChatCompleter: Groq first, Claude on any Groq failure.
 *
 * While the breaker is armed (Groq known rate-limited/down) we skip Groq
 * entirely and go straight to Claude — no wasted call. Once the breaker's
 * deadline passes, the next request optimistically retries Groq; success clears
 * the breaker and flips routing back to Groq automatically. This is the
 * self-healing "how do we know Groq reset" answer: we don't poll — we retry when
 * Groq's own `retry-after` says the window has passed.
 *
 * `schema` is used only by the Claude leg (Structured Outputs); Groq ignores it.
 */
export function createFallbackCompleter(
  options: ClaudeCompleterOptions,
): ChatCompleter {
  const claude = createClaudeCompleter(options);
  return async (messages) => {
    if (Date.now() < groqBlockedUntil) {
      // Groq is parked — don't burn a call we know will 429.
      return claude(messages);
    }
    try {
      const content = await groqComplete(messages);
      groqBlockedUntil = 0; // healthy again (breaker may have just expired)
      return content;
    } catch (err) {
      console.warn(
        `Groq unavailable, falling back to Claude: ${(err as Error).message}`,
      );
      return claude(messages);
    }
  };
}
