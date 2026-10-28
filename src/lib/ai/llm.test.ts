/**
 * Request-shape and error-reporting tests for the shared LLM adapter
 * (`createClaudeCompleter`). `fetch` is stubbed per test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createClaudeCompleter,
  type ChatCompleter,
  type ChatMessage,
} from "@/lib/ai/llm";

const messages: ChatMessage[] = [
  { role: "system", content: "sys" },
  { role: "user", content: "parse this" },
];

function claudeReply(body: Record<string, unknown>): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => body,
    text: async () => "",
  } as unknown as Response;
}

const claudeOk = (content = "claude-ok") =>
  claudeReply({
    stop_reason: "end_turn",
    content: [{ type: "text", text: content }],
    usage: { input_tokens: 10, cache_read_input_tokens: 9000 },
  });

function httpError(status: number, text = "error body"): Response {
  return {
    ok: false,
    status,
    statusText: "", // empty over HTTP/2, which made the old message useless
    headers: new Headers(),
    json: async () => ({}),
    text: async () => text,
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;
let responder: () => Response | Promise<Response>;
let complete: ChatCompleter;

function lastBody(): Record<string, unknown> {
  return JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body));
}

beforeEach(() => {
  process.env.CLAUDE_API_KEY = "sk-ant-test";
  responder = () => claudeOk();
  fetchMock = vi.fn(async () => responder());
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  complete = createClaudeCompleter({ schema: { type: "object" } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("request shape", () => {
  it("returns the text block of a successful reply", async () => {
    await expect(complete(messages)).resolves.toBe("claude-ok");
  });

  it("caches the system block so the reference lists aren't re-billed", async () => {
    await complete(messages);

    const body = lastBody() as {
      system: { text: string; cache_control?: { type: string } }[];
      messages: { role: string }[];
    };
    expect(body.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(body.system[0].text).toBe("sys");
    expect(body.messages.map((m) => m.role)).toEqual(["user"]);
  });

  it("constrains the reply with the schema via Structured Outputs", async () => {
    await complete(messages);

    expect(lastBody().output_config).toEqual({
      format: { type: "json_schema", schema: { type: "object" } },
    });
  });

  it("logs usage so cache hits are visible in the server log", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await complete(messages);

    expect(info.mock.calls.flat().join(" ")).toMatch(/cache_read_input_tokens/);
  });
});

describe("truncation and refusal", () => {
  it("surfaces a truncated reply rather than an opaque JSON error", async () => {
    responder = () =>
      claudeReply({
        stop_reason: "max_tokens",
        content: [{ type: "text", text: "{partial" }],
      });

    // 422, not 413: 413 reaches the browser as "Payload Too Large", which
    // describes the request and misleads about a reply that was cut short.
    await expect(complete(messages)).rejects.toMatchObject({
      message: expect.stringMatching(/cut off/i),
      status: 422,
    });
  });

  it("reports a refusal as a refusal, not an empty response", async () => {
    responder = () => claudeReply({ stop_reason: "refusal", content: [] });

    await expect(complete(messages)).rejects.toThrow(/declined/);
  });
});

describe("error reporting", () => {
  it("names Anthropic and explains a malformed key on a 401", async () => {
    process.env.CLAUDE_API_KEY = "sk-not-an-anthropic-key";
    responder = () =>
      httpError(401, JSON.stringify({ error: { message: "invalid x-api-key" } }));

    const error = (await complete(messages).catch((e) => e)) as Error;
    expect(error.message).toMatch(/Anthropic error/);
    expect(error.message).toMatch(/invalid x-api-key/);
    expect(error.message).toMatch(/begin with sk-ant-/);
  });

  it("passes the upstream status through", async () => {
    responder = () => httpError(529);

    await expect(complete(messages)).rejects.toMatchObject({ status: 529 });
  });

  it("reports a network failure as 503", async () => {
    responder = () => {
      throw new TypeError("fetch failed");
    };

    await expect(complete(messages)).rejects.toMatchObject({ status: 503 });
  });

  it("says which env var is missing when CLAUDE_API_KEY is unset", async () => {
    delete process.env.CLAUDE_API_KEY;

    await expect(complete(messages)).rejects.toThrow(/CLAUDE_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
