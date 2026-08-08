import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env";

/**
 * Shared multipart-upload proxy for the admin image routes.
 *
 * Why this exists instead of the catch-all `/api/*` rewrite in next.config:
 * on Vercel the rewrite is served by the edge proxy, which gives an external
 * destination only a short (~30s) window to respond. An image upload — receive
 * → process → push to object storage, plus a possible backend cold start —
 * routinely exceeds that, so the edge returns 504 *regardless of file size*
 * (which is why even sub-2MB images fail in production but work in `next dev`).
 *
 * A real Node route handler runs as a serverless function with a configurable
 * `maxDuration`, so it isn't bound by the edge proxy's window. The browser still
 * hits a same-origin path, so the session cookie is sent automatically (no
 * cross-origin/CORS/SameSite changes — ADR-0003); we just forward it onward.
 */

// Headers worth forwarding to the backend: the multipart boundary, the auth
// cookie, and the XHR marker the API client always sends (some CSRF checks
// require it).
const FORWARD_HEADERS = ["content-type", "cookie", "x-requested-with", "accept"];

export async function proxyUploadToBackend(
  req: Request,
  backendPath: string,
  maxDurationSeconds: number,
): Promise<Response> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { success: false, message: "Expected a multipart/form-data upload." },
      { status: 400 },
    );
  }

  const target = `${serverEnv().apiBaseUrl}${backendPath}`;

  // Buffer the body (chunked client-side to stay well under Vercel's request cap).
  const body = await req.arrayBuffer();

  const headers: Record<string, string> = {};
  for (const name of FORWARD_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers[name] = value;
  }

  // Give the backend almost the whole function budget before bailing.
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    (maxDurationSeconds - 5) * 1000,
  );

  try {
    const backendRes = await fetch(target, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Pass the backend response through verbatim so the API client's envelope
    // unwrapping and 401-refresh flow behave exactly as with the rewrite.
    const payload = await backendRes.arrayBuffer();
    const res = new NextResponse(payload, {
      status: backendRes.status,
      headers: {
        "content-type":
          backendRes.headers.get("content-type") ?? "application/json",
      },
    });
    for (const cookie of backendRes.headers.getSetCookie?.() ?? []) {
      res.headers.append("set-cookie", cookie);
    }
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error("[UPLOAD PROXY] failed for", backendPath, error);
    return NextResponse.json(
      {
        success: false,
        message: aborted
          ? "The image upload timed out. Please try again or upload fewer images at once."
          : "Image upload failed. Please try again.",
      },
      { status: aborted ? 504 : 502 },
    );
  }
}
