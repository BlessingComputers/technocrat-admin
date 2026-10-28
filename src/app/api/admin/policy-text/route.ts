import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env";

/**
 * The policy as customers currently read it, fetched from the storefront.
 *
 * `GET /api/admin/policy-text` → `{ text, chars, sourceUrl }`
 *
 * **Why the archived copy is scraped rather than typed.** The backend keeps
 * `contentText` so that a past order's consent can be shown against the words
 * that were on screen when it was given. If staff paste that text by hand, the
 * archive is a transcription of the page, and a transcription drifts. Reading
 * the rendered page makes the two identical by construction.
 *
 * **Why a proxy.** Same reason as `storefront-pages`: this is a server-to-server
 * read of another deployment, and the storefront sets no CORS headers.
 *
 * Failure is an error here, unlike the page list. There is no sensible fallback
 * text for a legal document, and publishing a stub as the archived policy would
 * be worse than not publishing at all.
 */

export const runtime = "nodejs";

const TIMEOUT_MS = 8000;
const POLICY_PATH = "/policies";

/**
 * Rendered HTML to the text a reader sees.
 *
 * Only `<main>`, so the header, nav and footer stay out of the archive — they
 * are chrome, they change on their own schedule, and a diff between two
 * versions should not light up because the cart badge moved.
 */
function extractPolicyText(html: string): string | null {
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  if (!main) return null;

  const text = main[1]
    .replace(/<(script|style|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|section|tr)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/[^\S\n]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    // Inline tags leave a space before the punctuation that followed them.
    .map((line) => line.replace(/ +([,.;:])/g, "$1"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.length > 0 ? text : null;
}

function problem(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const origin = serverEnv().storefrontUrl?.replace(/\/+$/, "");
  if (!origin) {
    return problem(
      "STOREFRONT_URL is not set, so the policy text cannot be read from the storefront.",
      503,
    );
  }

  const sourceUrl = `${origin}${POLICY_PATH}`;

  let html: string;
  try {
    const res = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
      headers: { accept: "text/html" },
    });
    if (!res.ok) {
      return problem(
        `The storefront answered ${res.status} for ${POLICY_PATH}.`,
        502,
      );
    }
    html = await res.text();
  } catch {
    return problem(`Could not reach the storefront at ${sourceUrl}.`, 502);
  }

  const text = extractPolicyText(html);
  if (!text) {
    return problem(
      "Fetched the policy page but found no readable text in it. Check the page renders before publishing.",
      502,
    );
  }

  return NextResponse.json(
    { text, chars: text.length, sourceUrl },
    { headers: { "cache-control": "no-store" } },
  );
}
