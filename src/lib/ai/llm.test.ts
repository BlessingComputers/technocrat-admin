/**
 * Fallback routing + circuit-breaker tests for the shared LLM adapter.
 *
 * Exercises `createFallbackCompleter`: Groq primary, Claude on any Groq failure,
 * and the shared in-memory breaker that parks Groq after a 429 until its
 * `retry-after` elapses, then optimistically retries. `fetch` is stubbed and
 * dispatched by host; the module-level breaker (`groqBlockedUntil`) is reset per
 * test via `vi.resetModules()`, and `Date.now()` is driven with fake timers so
 * the park/expire window is deterministic (the code uses no `setTimeout`).
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
    json: async () => ({ choices: [{ message: { content } }] }),
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

/** Fresh module (breaker reset to 0) + a completer with a dummy schema. */
async function freshCompleter(): Promise<ChatCompleter> {
  vi.resetModules();
  const mod = await import("@/lib/ai/llm");
  return mod.createFallbackCompleter({ schema: { type: "object" } });
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

describe("createFallbackCompleter", () => {
  it("uses Groq when it succeeds and never calls Claude", async () => {
    const complete = await freshCompleter();

    const result = await complete(messages);

    expect(result).toBe("groq-ok");
    expect(callsTo(GROQ_HOST)).toBe(1);
    expect(callsTo(CLAUDE_HOST)).toBe(0);
  });

  it("falls back to Claude when Groq returns 429", async () => {
    const complete = await freshCompleter();
    groqResponder = () => httpError(429, { "retry-after": "2" });

    const result = await complete(messages);

    expect(result).toBe("claude-ok");
    expect(callsTo(GROQ_HOST)).toBe(1);
    expect(callsTo(CLAUDE_HOST)).toBe(1);
  });

  it("skips Groq entirely while parked after a 429", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    groqResponder = () => httpError(429, { "retry-after": "2" });

    await complete(messages); // arms breaker until t=2000ms
    const result = await complete(messages); // time unchanged → still parked

    expect(result).toBe("claude-ok");
    expect(callsTo(GROQ_HOST)).toBe(1); // only the first call reached Groq
    expect(callsTo(CLAUDE_HOST)).toBe(2);
  });

  it("retries Groq once retry-after elapses, then resumes serving Groq", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    groqResponder = () => httpError(429, { "retry-after": "2" });

    await complete(messages); // parked until 2000ms

    vi.setSystemTime(2001);
    groqResponder = () => groqOk(); // Groq healthy again

    const retried = await complete(messages);
    expect(retried).toBe("groq-ok");
    expect(callsTo(GROQ_HOST)).toBe(2); // optimistic retry happened

    // Success cleared the breaker → the next call still routes to Groq.
    const next = await complete(messages);
    expect(next).toBe("groq-ok");
    expect(callsTo(GROQ_HOST)).toBe(3);
    expect(callsTo(CLAUDE_HOST)).toBe(1); // only the first (parked) call
  });

  it("parks Groq for the default window when a 429 omits retry-after", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    groqResponder = () => httpError(429); // no retry-after → 60s default

    await complete(messages);

    vi.setSystemTime(59_000);
    await complete(messages); // still within the default park window
    expect(callsTo(GROQ_HOST)).toBe(1);

    vi.setSystemTime(61_000);
    groqResponder = () => groqOk();
    await complete(messages); // window elapsed → Groq retried
    expect(callsTo(GROQ_HOST)).toBe(2);
  });

  it("parks Groq briefly on a 5xx and falls back to Claude", async () => {
    const complete = await freshCompleter();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    groqResponder = () => httpError(500);

    const result = await complete(messages);
    expect(result).toBe("claude-ok");

    vi.setSystemTime(1000); // inside the 30s cooldown
    await complete(messages);
    expect(callsTo(GROQ_HOST)).toBe(1); // Groq skipped while cooling down
  });

  it("does not park Groq on a non-429/5xx error (per-request fallback only)", async () => {
    const complete = await freshCompleter();
    groqResponder = () => httpError(400);

    await complete(messages); // 400 → fall back, but breaker NOT armed
    await complete(messages); // Groq attempted again

    expect(callsTo(GROQ_HOST)).toBe(2);
    expect(callsTo(CLAUDE_HOST)).toBe(2);
  });

  it("falls back to Claude when GROQ_API_KEY is unset", async () => {
    delete process.env.GROQ_API_KEY;
    const complete = await freshCompleter();

    const result = await complete(messages);

    expect(result).toBe("claude-ok");
    expect(callsTo(GROQ_HOST)).toBe(0); // no HTTP call was even attempted
    expect(callsTo(CLAUDE_HOST)).toBe(1);
  });
});
