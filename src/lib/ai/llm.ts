/**
 * Shared LLM adapter for the AI smart-paste parsers (products + parts).
 *
 * Two providers, both over plain REST (no SDK, matching the project's
 * dependency-light convention). The `ChatCompleter` seam keeps prompt-building
 * and response-parsing pure and testable: production wires in
 * `createFallbackCompleter`, tests pass a fake.
 *
 * Routing — Claude primary, Groq fallback (see `createFallbackCompleter`):
 * - Claude (Haiku 4.5, `createClaudeCompleter`) is paid but reliable, and adds
 *   Structured Outputs (`json_schema`) so its reply can't be malformed JSON and
 *   follows the extraction rules more closely. Haiku keeps cost low ($1 / $5 per
 *   1M tokens) vs Sonnet/Opus, and `cache_control` on the system block means the
 *   bulky category/brand lists are re-read from cache rather than re-billed.
 * - Groq (`gpt-oss-120b`) is free and fast but was demoted on 2026-08-19: one
 *   parse request runs ~22k tokens (mostly the reference lists) against a free
 *   `on_demand` tier capped at 8k tokens per minute, so Groq rejected every
 *   request outright with a 413. It stays wired as the fallback, behind the same
 *   circuit breaker, so raising the Groq tier is a config change not a code one.
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
  /**
   * True when the provider stopped mid-reply at its output ceiling.
   *
   * A flag rather than a status code: the routing logic needs to tell "the model
   * ran out of room" apart from "the HTTP request was rejected", and any status
   * used for the former would collide with a real transport meaning. 413 in
   * particular reaches the browser as "Payload Too Large", which describes the
   * request, not the reply, and would be read back as a genuine 413 here.
   */
  truncated: boolean;
  constructor(message: string, status: number, truncated = false) {
    super(message);
    this.name = "AiParseError";
    this.status = status;
    this.truncated = truncated;
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

/**
 * Shown when either provider stops because it ran out of output budget. The
 * parsers chunk large pastes precisely to avoid this, so seeing it means one
 * chunk was itself too dense (very long spec lists) rather than the paste being
 * long — hence the advice to split rather than to retry.
 */
export const TRUNCATED_MESSAGE =
  "The AI response was cut off because this paste produced too much data. " +
  "Split it into smaller batches and parse them separately.";

export interface ClaudeCompleterOptions {
  /**
   * JSON Schema the reply must satisfy (Structured Outputs). Objects need
   * `additionalProperties: false` and should list every property in `required`
   * (use nullable types, e.g. `["string", "null"]`, for optional fields).
   *
   * Both providers now enforce it: Anthropic via `output_config`, Groq via
   * OpenAI-style strict `json_schema`. The constraints above are exactly what
   * Groq's strict mode requires, so one schema object serves both.
   */
  schema: Record<string, unknown>;
  /** Schema name required by Groq's `json_schema` block. Slug-ish, no spaces. */
  schemaName: string;
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
      throw new AiParseError(
        "CLAUDE_API_KEY not configured (.env.development for dev, " +
          ".env.production for the deploy)",
        500,
      );
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
      // `statusText` is empty over HTTP/2, which is what made the old message
      // ("AI service error (401): ") say nothing at all. Anthropic puts a real
      // explanation in the body, so use that.
      let detail = errorBody.slice(0, 200);
      try {
        detail = JSON.parse(errorBody)?.error?.message ?? detail;
      } catch {
        // Not JSON — the truncated body is the best detail available.
      }
      // A 401 is almost always a malformed key rather than a revoked one, and
      // the shape is checkable. Say so instead of leaving it to guesswork.
      const hint =
        response.status === 401 && !apiKey.startsWith("sk-ant-")
          ? " CLAUDE_API_KEY does not look like an Anthropic key: those begin with sk-ant-."
          : "";
      throw new AiParseError(
        `Anthropic error (${response.status}): ${detail}${hint}`,
        response.status,
      );
    }

    const data = await response.json();
    // A safety refusal returns HTTP 200 with no text block — surface it clearly
    // rather than as an empty-JSON parse failure.
    if (data?.stop_reason === "refusal") {
      throw new AiParseError("AI declined to parse this input", 422);
    }
    // Hitting the output ceiling truncates mid-JSON. Say so, instead of letting
    // it reach the user as an opaque "Failed to parse AI response as JSON".
    if (data?.stop_reason === "max_tokens") {
      console.error(
        "Claude truncated at max_tokens. usage:",
        JSON.stringify(data?.usage),
      );
      throw new AiParseError(TRUNCATED_MESSAGE, 422, true);
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
/**
 * Groq's recommended replacement for `llama-3.3-70b-versatile`, which Groq
 * decommissioned on 2026-08-16. Same OpenAI-compatible endpoint and JSON mode.
 */
const GROQ_MODEL = "openai/gpt-oss-120b";

/** 429 with no parsable `retry-after` — park Groq this long before retrying. */
const GROQ_DEFAULT_RETRY_MS = 60_000;
/** Transient Groq failure (5xx / network) — brief park so we don't hammer it. */
const GROQ_ERROR_COOLDOWN_MS = 30_000;
/**
 * Account/config-level failure — bad key, or a model slug Groq doesn't serve
 * (its models get decommissioned on a published schedule). Park Groq for a long
 * spell: these fail identically for every caller and don't clear on their own,
 * so retrying per-request only bolts a doomed round-trip onto the hot path
 * before the Claude fallback runs.
 */
const GROQ_CONFIG_ERROR_COOLDOWN_MS = 15 * 60_000;
/** Statuses treated as config-level rather than per-request. */
const GROQ_CONFIG_ERROR_STATUSES = new Set([401, 403, 404]);

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
 * Groq's machine-readable failure code, e.g. "rate_limit_exceeded". The HTTP
 * status alone is not enough to classify a Groq failure: it reports the
 * tokens-per-minute cap as a 413, which would otherwise read as a plain
 * request-too-large and be handled as a one-off rather than as a rate limit.
 */
function groqErrorCode(errorBody: string): string | null {
  try {
    return JSON.parse(errorBody)?.error?.code ?? null;
  } catch {
    return null;
  }
}

/**
 * Groq adapter. Uses the OpenAI-compatible endpoint with `json_object` (Groq's
 * general JSON mode). Arms the shared breaker on failure so future requests skip
 * a provider we know is unavailable: a 429 parks Groq until its `retry-after`;
 * a transient 5xx/network error parks it briefly; an auth/unknown-model 4xx parks
 * it for much longer; other 4xx (a per-request problem, not an outage) don't arm
 * the breaker. Always throws on failure — the fallback wrapper turns that into a
 * Claude call.
 */
async function groqComplete(
  messages: ChatMessage[],
  options: ClaudeCompleterOptions,
): Promise<string> {
  const apiKey = serverEnv().groqApiKey;
  if (!apiKey) {
    throw new AiParseError(
      "GROQ_API_KEY not configured (.env.development for dev, " +
        ".env.production for the deploy)",
      500,
    );
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
        max_completion_tokens: MAX_TOKENS,
        // gpt-oss reasons before answering, and those tokens come out of
        // `max_completion_tokens`. Schema-guided extraction needs no deep
        // deliberation, so cap the thinking: it keeps the budget for the actual
        // JSON, and cuts latency on every parse.
        reasoning_effort: "low",
        // Strict Structured Outputs, matching the Claude leg. Groq previously
        // got plain `json_object` here, which guarantees parseable JSON and
        // nothing else — no required keys, no enums — on what is the DEFAULT
        // path for every parse. gpt-oss-120b supports the strict form.
        response_format: {
          type: "json_schema",
          json_schema: {
            name: options.schemaName,
            schema: options.schema,
            strict: true,
          },
        },
      }),
    });
  } catch (err) {
    groqBlockedUntil = Date.now() + GROQ_ERROR_COOLDOWN_MS;
    throw new AiParseError(
      `Groq unreachable: ${(err as Error).message}`,
      503,
    );
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Groq API Error:", response.status, errorBody);
    const code = groqErrorCode(errorBody);

    // Groq signals its token-per-minute cap as HTTP 413 with
    // `code: rate_limit_exceeded`, NOT as a 429. Without this branch the
    // breaker never arms for it, and every parse pays a doomed multi-second
    // round-trip before falling back.
    if (code === "rate_limit_exceeded" || response.status === 429) {
      // A 429 clears on its own schedule, so honour `retry-after`. A 413 means
      // this single request exceeds the whole per-minute budget, which no amount
      // of waiting fixes — park it long and stop paying for the discovery.
      const structural = response.status === 413;
      const wait = structural
        ? GROQ_CONFIG_ERROR_COOLDOWN_MS
        : (parseRetryAfterMs(response.headers) ?? GROQ_DEFAULT_RETRY_MS);
      groqBlockedUntil = Date.now() + wait;
      console.warn(
        `Groq rate-limited (${response.status}); parking for ` +
          `${Math.round(wait / 1000)}s, routing to Claude.` +
          (structural
            ? " The request alone exceeds the per-minute token budget, so " +
              "waiting will not help: shrink the prompt or raise the Groq tier."
            : ""),
      );
      throw new AiParseError(`Groq rate-limited (${response.status})`, 429);
    }

    if (response.status >= 500) {
      groqBlockedUntil = Date.now() + GROQ_ERROR_COOLDOWN_MS;
    } else if (GROQ_CONFIG_ERROR_STATUSES.has(response.status)) {
      console.error(
        `Groq rejected model "${GROQ_MODEL}" or the API key ` +
          `(${response.status}); parking for ` +
          `${GROQ_CONFIG_ERROR_COOLDOWN_MS / 60_000}min, routing to Claude.`,
      );
      groqBlockedUntil = Date.now() + GROQ_CONFIG_ERROR_COOLDOWN_MS;
    }
    throw new AiParseError(`Groq error (${response.status})`, response.status);
  }

  const data = await response.json();
  const choice = data?.choices?.[0];
  // OpenAI-compatible truncation signal. Same reasoning as the Claude leg.
  // Logged with usage because gpt-oss is a reasoning model: its thinking tokens
  // draw on the same `max_completion_tokens` budget as the answer, so a reply
  // can hit the ceiling on input that looks far too small to.
  if (choice?.finish_reason === "length") {
    console.error(
      "Groq truncated (finish_reason=length). usage:",
      JSON.stringify(data?.usage),
      "content length:",
      choice?.message?.content?.length ?? 0,
    );
    throw new AiParseError(TRUNCATED_MESSAGE, 422, true);
  }
  const content = choice?.message?.content;
  if (!content) throw new AiParseError("Groq returned an empty response", 500);
  return content;
}

/**
 * Production ChatCompleter: Claude first, Groq on any Claude failure.
 *
 * Every parse logs which provider served it. That line exists because the
 * fallback paths are otherwise silent, so a routing surprise — a parked breaker,
 * a demoted provider — is invisible from the UI and reads from the server log as
 * though nothing happened.
 *
 * The circuit breaker still guards Groq, now on the fallback side: once Groq has
 * failed we skip it until its deadline passes rather than paying a second doomed
 * round-trip on top of an already-failed Claude call. Groq's own `retry-after`
 * decides when to retry, so the breaker is self-healing and needs no polling.
 *
 * `schema` constrains both legs (Structured Outputs on Anthropic, strict
 * `json_schema` on Groq), so a fallback parse is held to the same shape as a
 * primary one.
 */
export function createFallbackCompleter(
  options: ClaudeCompleterOptions,
): ChatCompleter {
  const claude = createClaudeCompleter(options);
  return async (messages) => {
    let claudeError: unknown;
    try {
      const content = await claude(messages);
      console.info(`[ai] served by Claude (${CLAUDE_MODEL})`);
      return content;
    } catch (err) {
      // A truncated Claude reply is terminal. Groq has the smaller usable output
      // budget — it spends part of it on reasoning tokens — so it cannot fit a
      // reply Haiku could not. Retrying would buy latency and the same failure.
      if (err instanceof AiParseError && err.truncated) throw err;
      claudeError = err;
      console.warn(
        `Claude unavailable, falling back to Groq: ${(err as Error).message}`,
      );
    }

    const claudeReason = (claudeError as Error).message;

    if (Date.now() < groqBlockedUntil) {
      // Groq is parked. With Claude already down there is nothing left to try,
      // so surface Claude's error rather than a misleading Groq one.
      const seconds = Math.ceil((groqBlockedUntil - Date.now()) / 1000);
      console.error(
        `[ai] both providers unavailable — Groq parked for another ${seconds}s`,
      );
      throw claudeError;
    }

    try {
      const content = await groqComplete(messages, options);
      groqBlockedUntil = 0; // healthy again (breaker may have just expired)
      console.info(`[ai] served by Groq (${GROQ_MODEL}) after Claude failed`);
      return content;
    } catch (groqErr) {
      const groqReason = (groqErr as Error).message;
      console.error(`[ai] both providers failed. Groq: ${groqReason}`);
      // The user would otherwise see only the second failure and conclude Groq
      // is the whole system, so carry Claude's reason along with it.
      if (claudeError instanceof AiParseError) {
        throw new AiParseError(
          `${claudeReason} [Groq fallback also failed: ${groqReason}]`,
          claudeError.status,
          claudeError.truncated,
        );
      }
      throw claudeError;
    }
  };
}
