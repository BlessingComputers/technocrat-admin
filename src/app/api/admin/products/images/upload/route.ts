import { NextResponse } from "next/server";
import { proxyUploadToBackend } from "@/lib/api/upload-proxy";

/**
 * Product image-upload proxy (single-product form). Routes the multipart upload
 * through a Node serverless function instead of the `/api/*` edge rewrite, whose
 * ~30s window 504s the backend's upload+store round-trip on Vercel even for tiny
 * files. See lib/api/upload-proxy.ts for the full rationale.
 *
 * IMPORTANT: this is a STATIC route (productId comes via `?productId=`, not a
 * `[id]` path segment) on purpose. Next.js checks static filesystem routes
 * BEFORE `afterFiles` rewrites but dynamic routes AFTER them — so a `[id]`
 * handler would be swallowed by the catch-all `/api/*` rewrite and proxied to
 * the backend (→ 404). Keeping it static lets the handler win.
 */

export const runtime = "nodejs";
// Raise the ceiling well above the edge proxy's ~30s window. Vercel clamps this
// to the plan max (60s Hobby, up to 300s Pro); bump it if the backend needs more.
export const maxDuration = 60;

export async function POST(req: Request) {
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { success: false, message: "Missing productId." },
      { status: 400 },
    );
  }
  return proxyUploadToBackend(
    req,
    `/v1/products/${productId}/images`,
    maxDuration,
  );
}
