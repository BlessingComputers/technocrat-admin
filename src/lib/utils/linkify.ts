/**
 * Splits a plain-text body into text and link runs so a renderer can turn bare
 * URLs into anchors without ever touching `dangerouslySetInnerHTML`.
 *
 * The AI first responder answers product questions with plain-text URLs rather
 * than markup tokens, so linkifying them is the client's job. It applies to
 * every message body, not just AI ones — staff paste links too.
 *
 * Deliberately duplicated in the customer app (`src/shared/utils/linkify.ts`).
 * The two are separate repos; a shared package for one pure function is not
 * worth the coupling. Keep them in step by hand.
 */

/** One run of a body: either literal text or a URL that should become an anchor. */
export type LinkifyPart =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

/**
 * Only an explicit `http(s)://` scheme or a `www.` prefix counts. Anything
 * looser (a bare `example.com`) turns ordinary prose into false links, and
 * anchoring on these two prefixes also makes `javascript:` unreachable by
 * construction.
 */
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>]+/gi;

/** Sentence punctuation that follows a URL far more often than it belongs to one. */
const TRAILING_PUNCTUATION = /[.,;:!?'"“”‘’]+$/;

const CLOSERS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

function occurrences(value: string, char: string): number {
  let count = 0;
  for (const c of value) if (c === char) count += 1;
  return count;
}

/**
 * Walks back off the end of a match until what remains is plausibly the URL the
 * author meant: `…/product/foo.` loses the full stop, but `…/foo(bar)` keeps
 * its balanced parenthesis.
 */
function trimTrailing(raw: string): string {
  let url = raw;

  for (;;) {
    const withoutPunctuation = url.replace(TRAILING_PUNCTUATION, "");
    if (withoutPunctuation !== url) {
      url = withoutPunctuation;
      continue;
    }

    const last = url.at(-1) ?? "";
    const opener = CLOSERS[last];
    if (opener && occurrences(url, opener) < occurrences(url, last)) {
      url = url.slice(0, -1);
      continue;
    }

    return url;
  }
}

/** Resolves a candidate to a safe absolute href, or null if it is not one. */
function toHref(candidate: string): string | null {
  const withScheme = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // A hostname with no dot is either a typo or an intranet name we should not
  // be guessing at from a customer-visible message.
  if (!url.hostname.includes(".")) return null;

  // Deliberately the un-normalised string: `new URL().toString()` appends a
  // trailing slash, which would make the href disagree with the visible text.
  return withScheme;
}

/**
 * Returns the body split into renderable parts. A body with no URLs comes back
 * as a single text part, so callers never need to special-case that.
 */
export function linkify(body: string): LinkifyPart[] {
  const parts: LinkifyPart[] = [];
  let lastIndex = 0;

  URL_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_PATTERN.exec(body)) !== null) {
    const candidate = trimTrailing(match[0]);
    const href = toHref(candidate);
    // Leave a rejected candidate in place: not advancing `lastIndex` folds it
    // back into the surrounding text run.
    if (!href) continue;

    if (match.index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    parts.push({ type: "link", value: candidate, href });
    lastIndex = match.index + candidate.length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts;
}
