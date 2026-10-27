/**
 * Routing, circuit-breaker and error-reporting tests for the shared LLM adapter.
 *
 * Exercises `createFallbackCompleter`: Claude primary, Groq on any Claude
 * failure, and the shared in-memory breaker that parks Groq after a rate limit
 * until its window elapses. `fetch` is stubbed and dispatched by host; the
 * module-level breaker (`groqBlockedUntil`) is reset per test via
 * `vi.resetModules()`, and `Date.now()` is driven with fake timers so the
 * park/expire windows are deterministic (the code uses no `setTimeout`).
 *
 * Groq sits on the fallback leg because its free tier caps at 8k tokens/minute
 * and one parse request runs ~22k — see the module header in `llm.ts`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatCompleter, ChatMessage } from "@/lib/ai/llm";

const GROQ_HOST = "groq.com";
const CLAUDE_HOST = "anthropic.com";

const messages: ChatMessage[] = [
  { role: "system", content: "sys" },
  { role: "user", content: "parse this" },
];

function groqOk(content = "groq-ok"): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({
      choices: [{ finish_reason: "stop", message: { content } }],
    }),
    text: async () => "",
  } as unknown as Response;
}

function claudeOk(content = "claude-ok"): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({
      stop_reason: "end_turn",
      content: [{ type: "text", text: content }],
    }),
    text: async () => "",
  } as unknown as Response;
}

/** HTTP 200, but the reply was cut off at the output ceiling. */
function groqTruncated(): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({
      choices: [{ finish_reason: "length", message: { content: "{partial" } }],
    }),
    text: async () => "",
  } as unknown as Response;
}

/** Anthropic's equivalent: HTTP 200 with stop_reason max_tokens. */
function claudeTruncated(): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({
      stop_reason: "max_tokens",
      content: [{ type: "text", text: "{partial" }],
    }),
    text: async () => "",
  } as unknown as Response;
}

/** Groq's tokens-per-minute cap: HTTP 413 carrying a rate-limit code. */
function rateLimit413(): Response {
  return {
    ok: false,
    status: 413,
    headers: new Headers(),
    json: async () => ({}),
    text: async () =>
      JSON.stringify({
        error: {
          message:
            "Request too large ... on tokens per minute (TPM): Limit 8000, Requested 22360",
          type: "tokens",
          code: "rate_limit_exceeded",
        },
      }),
  } as unknown as Response;
}

function httpError(
  status: number,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: false,
    status,
    headers: new Headers(headers),
    json: async () => ({}),
    text: async () => "error body",
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;
let groqResponder: () => Response | Promise<Response>;
let claudeResponder: () => Response | Promise<Response>;

/** How many times `fetch` was called against a given provider host. */
function callsTo(host: string): number {
  return fetchMock.mock.calls.filter((c) => String(c[0]).includes(host)).length;
}

/** The most recent request body sent to a given provider host. */
function lastBodyTo(host: string): Record<string, unknown> {
  const call = [...fetchMock.mock.calls]
    .reverse()
    .find((c) => String(c[0]).includes(host));
  return JSON.parse(String(call?.[1]?.body));
}

/** Fresh module (breaker reset to 0) + a completer with a dummy schema. */
async function freshCompleter(): Promise<ChatCompleter> {
  vi.resetModules();
  const mod = await import("@/lib/ai/llm");
  return mod.createFallbackCompleter({
    schema: { type: "object" },
    schemaName: "test",
  });
}

beforeEach(() => {
  process.env.GROQ_API_KEY = "gsk_test";
  process.env.CLAUDE_API_KEY = "sk-ant-test";
  groqResponder = () => groqOk();
  claudeResponder = () => claudeOk();
  fetchMock = vi.fn(async (url: string | URL | Request) => {
    const u = String(url);
    if (u.includes(GROQ_HOST)) return groqResponder();
    if (u.includes(CLAUDE_HOST)) return claudeResponder();
    throw new Error(`unexpected fetch: ${u}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createFallbackCompleter routing", () => {
  it("uses Claude when it succeeds and never calls Groq", async () => {
    const complete = await freshCompleter();

    const result = await complete(messages);

    expect(result).toBe("claude-ok");
    expect(callsTo(GROQ_HOST)).toBe(0);
  });

  it("falls back to Groq when Claude fails", async () => {
    const complete = await freshCompleter();
    claudeResponder = () => httpError(529);

    await expect(complete(messages)).resolves.toBe("groq-ok");
    expect(callsTo(GROQ_HOST)).toBe(1);
  });

  it("says which provider served the parse", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const complete = await freshCompleter();

    await complete(messages);

    expect(info.mock.calls.flat().join(" ")).toMatch(/served by Claude/);
  });

  it("says when the fallback served it, not just that it worked", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const complete = await freshCompleter();
    claudeResponder = () => httpError(529);

    await complete(messages);

    expect(info.mock.calls.flat().join(" ")).toMatch(
      /served by Groq .* after Claude failed/,
    );
  });
});

describe("Groq circuit breaker", () => {
  it("parks Groq after a 429 and skips it while parked", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    claudeResponder = () => httpError(529);
    groqResponder = () => httpError(429, { "retry-after": "2" });

    await expect(complete(messages)).rejects.toThrow();

    vi.setSystemTime(1000); // inside the retry-after window
    await expect(complete(messages)).rejects.toThrow();
    expect(callsTo(GROQ_HOST)).toBe(1); // second call skipped Groq entirely
  });

  it("retries Groq once retry-after elapses", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    claudeResponder = () => httpError(529);
    groqResponder = () => httpError(429, { "retry-after": "2" });

    await expect(complete(messages)).rejects.toThrow();

    vi.setSystemTime(2500); // window elapsed
    groqResponder = () => groqOk();
    await expect(complete(messages)).resolves.toBe("groq-ok");
    expect(callsTo(GROQ_HOST)).toBe(2);
  });

  it("parks for the default window when a 429 omits retry-after", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    claudeResponder = () => httpError(529);
    groqResponder = () => httpError(429);

    await expect(complete(messages)).rejects.toThrow();

    vi.setSystemTime(30_000); // inside the 60s default
    await expect(complete(messages)).rejects.toThrow();
    expect(callsTo(GROQ_HOST)).toBe(1);
  });

  it("parks Groq briefly on a 5xx", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    claudeResponder = () => httpError(529);
    groqResponder = () => httpError(500);

    await expect(complete(messages)).rejects.toThrow();

    vi.setSystemTime(1000); // inside the 30s cooldown
    await expect(complete(messages)).rejects.toThrow();
    expect(callsTo(GROQ_HOST)).toBe(1);
  });

  it("parks Groq for a long window when it rejects the model or key", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    claudeResponder = () => httpError(529);
    groqResponder = () => httpError(404); // decommissioned/unknown model slug

    await expect(complete(messages)).rejects.toThrow();

    vi.setSystemTime(60_000); // past the 429/5xx windows, inside the config one
    await expect(complete(messages)).rejects.toThrow();
    expect(callsTo(GROQ_HOST)).toBe(1); // no doomed retry
  });

  it("parks Groq when a 413 turns out to be the token-per-minute cap", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    claudeResponder = () => httpError(529);
    // Groq reports its TPM cap as a 413, not a 429. Read as a plain
    // request-too-large it never armed the breaker, so every parse paid a
    // doomed multi-second round-trip.
    groqResponder = () => rateLimit413();

    await expect(complete(messages)).rejects.toThrow();

    vi.setSystemTime(120_000); // well past any retry-after window
    await expect(complete(messages)).rejects.toThrow();
    expect(callsTo(GROQ_HOST)).toBe(1); // still parked: waiting cannot help
  });

  it("does not park Groq on a plain 400 (a per-request problem)", async () => {
    const complete = await freshCompleter();
    claudeResponder = () => httpError(529);
    groqResponder = () => httpError(400);

    await expect(complete(messages)).rejects.toThrow();
    await expect(complete(messages)).rejects.toThrow();

    expect(callsTo(GROQ_HOST)).toBe(2); // attempted again
  });
});

describe("request shape", () => {
  it("sends the schema to Groq as strict json_schema", async () => {
    const complete = await freshCompleter();
    claudeResponder = () => httpError(529);

    await complete(messages);

    const body = lastBodyTo(GROQ_HOST) as {
      response_format: {
        type: string;
        json_schema: { name: string; strict: boolean; schema: unknown };
      };
    };
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.name).toBe("test");
    expect(body.response_format.json_schema.schema).toEqual({ type: "object" });
  });

  it("caps reasoning effort so thinking cannot eat the whole output budget", async () => {
    const complete = await freshCompleter();
    claudeResponder = () => httpError(529);

    await complete(messages);

    const body = lastBodyTo(GROQ_HOST);
    expect(body.reasoning_effort).toBe("low");
    expect(body.max_completion_tokens as number).toBeGreaterThan(0);
  });

  it("caches the Claude system block so the reference lists aren't re-billed", async () => {
    const complete = await freshCompleter();

    await complete(messages);

    const body = lastBodyTo(CLAUDE_HOST) as {
      system: { cache_control?: { type: string } }[];
    };
    expect(body.system[0].cache_control).toEqual({ type: "ephemeral" });
  });
});

describe("truncation", () => {
  it("surfaces a truncated Claude reply rather than an opaque JSON error", async () => {
    const complete = await freshCompleter();
    claudeResponder = () => claudeTruncated();

    // Terminal: Groq has the smaller usable output budget, so it cannot fit a
    // reply Haiku could not.
    await expect(complete(messages)).rejects.toThrow(/cut off/i);
    expect(callsTo(GROQ_HOST)).toBe(0);
  });

  it("does not report truncation as a payload-size error", async () => {
    const complete = await freshCompleter();
    claudeResponder = () => claudeTruncated();

    // 413 reaches the browser as "Payload Too Large", which describes the
    // request and misleads about a reply that was simply cut short.
    await expect(complete(messages)).rejects.toMatchObject({
      truncated: true,
      status: 422,
    });
  });

  it("treats a truncated Groq fallback as a failure, not as content", async () => {
    const complete = await freshCompleter();
    claudeResponder = () => httpError(529);
    groqResponder = () => groqTruncated();

    await expect(complete(messages)).rejects.toThrow();
  });
});

describe("error reporting", () => {
  it("names Anthropic and explains a malformed key on a 401", async () => {
    process.env.CLAUDE_API_KEY = "sk-not-an-anthropic-key";
    const complete = await freshCompleter();
    groqResponder = () => httpError(500);
    claudeResponder = () =>
      ({
        ok: false,
        status: 401,
        statusText: "", // empty over HTTP/2, which made the old message useless
        headers: new Headers(),
        json: async () => ({}),
        text: async () =>
          JSON.stringify({ error: { message: "invalid x-api-key" } }),
      }) as unknown as Response;

    // One call, three assertions: a second call would find the breaker armed
    // and never reach Groq, which is a different path.
    const error = (await complete(messages).catch((e) => e)) as Error;
    expect(error.message).toMatch(/Anthropic error/);
    expect(error.message).toMatch(/invalid x-api-key/);
    expect(error.message).toMatch(/begin with sk-ant-/);
  });

  it("reports both provider failures when neither can serve", async () => {
    const complete = await freshCompleter();
    claudeResponder = () => httpError(529);
    groqResponder = () => rateLimit413();

    // Otherwise the user sees only the second failure and concludes the
    // fallback provider is the whole system.
    const error = (await complete(messages).catch((e) => e)) as Error;
    expect(error.message).toMatch(/Anthropic error/);
    expect(error.message).toMatch(/Groq fallback also failed/);
  });

  it("falls back to Groq when CLAUDE_API_KEY is unset", async () => {
    delete process.env.CLAUDE_API_KEY;
    const complete = await freshCompleter();

    await expect(complete(messages)).resolves.toBe("groq-ok");
  });

  it("surfaces Claude's error when Groq has no key either", async () => {
    delete process.env.CLAUDE_API_KEY;
    delete process.env.GROQ_API_KEY;
    const complete = await freshCompleter();

    await expect(complete(messages)).rejects.toThrow(/CLAUDE_API_KEY/);
  });
});
