import { describe, expect, it } from "vitest";
import { linkify } from "./linkify";

/** Convenience: just the hrefs, in order. */
function hrefs(body: string): string[] {
  return linkify(body).flatMap((part) =>
    part.type === "link" ? [part.href] : [],
  );
}

/** Convenience: the body as the reader sees it, links inlined as their text. */
function rendered(body: string): string {
  return linkify(body)
    .map((part) => part.value)
    .join("");
}

describe("linkify", () => {
  it("leaves a body with no URL as a single text part", () => {
    expect(linkify("Hello, how can I help?")).toEqual([
      { type: "text", value: "Hello, how can I help?" },
    ]);
  });

  it("turns a bare URL mid-sentence into one anchor", () => {
    const parts = linkify(
      "You can order it at https://blessingcomputers.com/product/hp-840 today.",
    );
    expect(parts).toEqual([
      { type: "text", value: "You can order it at " },
      {
        type: "link",
        value: "https://blessingcomputers.com/product/hp-840",
        href: "https://blessingcomputers.com/product/hp-840",
      },
      { type: "text", value: " today." },
    ]);
  });

  it("does not swallow trailing punctuation into the href", () => {
    expect(hrefs("See https://blessingcomputers.com/product/foo.")).toEqual([
      "https://blessingcomputers.com/product/foo",
    ]);
    expect(hrefs("Is it https://example.com/a?")).toEqual([
      "https://example.com/a",
    ]);
    expect(hrefs('He said "https://example.com/a", then left')).toEqual([
      "https://example.com/a",
    ]);
  });

  it("keeps a balanced bracket that belongs to the URL", () => {
    expect(hrefs("https://example.com/wiki/HP_(company) is the page")).toEqual([
      "https://example.com/wiki/HP_(company)",
    ]);
    expect(hrefs("(see https://example.com/a)")).toEqual([
      "https://example.com/a",
    ]);
  });

  it("produces two anchors for two URLs in one body", () => {
    const parts = linkify(
      "Compare https://example.com/a and https://example.com/b",
    );
    expect(parts.filter((part) => part.type === "link")).toHaveLength(2);
    expect(hrefs("Compare https://example.com/a and https://example.com/b"))
      .toEqual(["https://example.com/a", "https://example.com/b"]);
  });

  it("gives a www-prefixed URL an https href while showing the original text", () => {
    const parts = linkify("Visit www.blessingcomputers.com for more");
    expect(parts[1]).toEqual({
      type: "link",
      value: "www.blessingcomputers.com",
      href: "https://www.blessingcomputers.com",
    });
  });

  it("does not produce a broken href from URL-shaped text", () => {
    // A scheme with no host, an email address, a path fragment and a bare
    // hostname all stay literal.
    expect(hrefs("the prefix https:// on its own")).toEqual([]);
    expect(hrefs("mail sales@blessingcomputers.com please")).toEqual([]);
    expect(hrefs("open /product/hp-840 next")).toEqual([]);
    expect(hrefs("go to blessingcomputers.com")).toEqual([]);
    expect(hrefs("read httpsnotaurl now")).toEqual([]);
  });

  it("never emits a non-http scheme", () => {
    expect(hrefs("javascript:alert(1)")).toEqual([]);
    expect(hrefs("data:text/html;base64,PHN2Zz4=")).toEqual([]);
  });

  it("preserves the full body text across the split", () => {
    const body =
      "Order https://example.com/a, or call us. Also see www.example.com/b!";
    expect(rendered(body)).toBe(body);
  });

  it("returns no parts for an empty body", () => {
    expect(linkify("")).toEqual([]);
  });
});
