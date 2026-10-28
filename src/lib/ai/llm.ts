/**
 * Shared LLM adapter for the AI smart-paste parsers (products + parts).
 *
 * Claude Haiku 4.5 over plain REST (no SDK, matching the project's
 * dependency-light convention). Haiku keeps cost low ($1 / $5 per 1M tokens),
 * Structured Outputs (`json_schema`) means the reply can't be malformed JSON,
 * and `cache_control` on the system block means the bulky category/brand lists
 * are re-read from cache rather than re-billed.
 *
 * The `ChatCompleter` seam keeps prompt-building and response-parsing pure and
 * testable: production wires in `createClaudeCompleter`, tests pass a fake.
 *
 * The raw text still passes through the parsers' normalize/validate passes,
 * which enforce referential checks (a subcategory that belongs to its category,
 * an ID that exists in the provided lists) that a schema can't express.
 *
 * Groq used to be wired as a fallback. It was retired on 2026-09-23: its free
 * tier caps at 8k tokens/minute and one parse runs ~22k, so it had rejected
 * every request since 2026-08-19.
 */

import { serverEnv } from "@/config/env";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/** The seam: turn chat messages into the model's reply content. */
/**
 * House style for any text the AI writes that people read: shop descriptions
 * and the lookup's notes for staff. Left to itself the model writes hedged,
 * puffed-up copy ("responsibly built", "appears to be non-standard").
 */
export const PLAIN_WRITING = `
WRITING RULES (for every description and note you write):
- Plain English for shop staff and customers in Nigeria. Short sentences, under 20 words. Active voice. Everyday words.
- Say what the product has, with the numbers: "8GB RAM and a 256GB SSD", not "ample memory and storage".
- No hype: powerful, sleek, stunning, seamless, premium, perfect for, ideal for, elevate, experience, designed to, whether you're.
- No hedging: appears, seems, typically, likely, may, could not be confirmed. When you're unsure, say what you saw instead ("the searches found no 4GB model").
- No em dashes, parentheses, semicolons or markdown.
`.trim();

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
 * "max_tokens"`), the route surfaces `TRUNCATED_MESSAGE` — split the paste, or
 * move this adapter to streaming.
 */
const MAX_TOKENS = 16000;

/**
 * Shown when the model stops because it ran out of output budget. The parsers
 * chunk large pastes precisely to avoid this, so seeing it means one chunk was
 * itself too dense (very long spec lists) rather than the paste being long —
 * hence the advice to split rather than to retry.
 */
export const TRUNCATED_MESSAGE =
  "The AI response was cut off because this paste produced too much data. " +
  "Split it into smaller batches and parse them separately.";

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
/**
 * One raw Messages API call. Model, auth and error mapping live here; the
 * request body (tools, schema, messages) is the caller's. Used by the
 * smart-paste completer below and by the product enricher, which needs server
 * tools and a multi-turn loop.
 */
export async function callClaude(
  body: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const apiKey = serverEnv().claudeApiKey;
  if (!apiKey) {
    throw new AiParseError(
      "CLAUDE_API_KEY not configured (.env.development for dev, " +
        ".env.production for the deploy)",
      500,
    );
  }

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: CLAUDE_MODEL, temperature: 0, ...body }),
    });
  } catch (err) {
    throw new AiParseError(
      `AI service unreachable: ${(err as Error).message}`,
      503,
    );
  }

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
  // Per-call usage, so the server log shows whether the cached system prompt
  // (the reference lists) is being read back: `cache_read_input_tokens`
  // should be non-zero from the second parse in a session onward.
  console.info("[ai] Claude usage:", JSON.stringify(data?.usage));
  // A safety refusal returns HTTP 200 with no text block — surface it clearly
  // rather than as an empty-JSON parse failure.
  if (data?.stop_reason === "refusal") {
    throw new AiParseError("AI declined to parse this input", 422);
  }
  return data;
}

export function createClaudeCompleter(
  options: ClaudeCompleterOptions,
): ChatCompleter {
  return async (messages) => {
    // Anthropic wants the system prompt as its own field; only user/assistant
    // roles are allowed inside `messages`.
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => ({ role: "user" as const, content: m.content }));

    const data = await callClaude({
      max_tokens: MAX_TOKENS,
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
    });
    // Hitting the output ceiling truncates mid-JSON. Say so, instead of letting
    // it reach the user as an opaque "Failed to parse AI response as JSON".
    // 422 rather than 413: 413 reaches the browser as "Payload Too Large",
    // which describes the request, not a reply that was cut short.
    if (data?.stop_reason === "max_tokens") {
      throw new AiParseError(TRUNCATED_MESSAGE, 422);
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
