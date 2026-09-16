import { NextResponse } from "next/server";
import { proxyUploadToBackend } from "@/lib/api/upload-proxy";

/**
 * Promotion slide-upload proxy. Routes the multipart upload (images + a
 * `metadata` JSON field) through a Node serverless function instead of the
 * `/api/*` edge rewrite, whose ~30s window 504s the backend's upload+store
 * round-trip on Vercel even for small files — see lib/api/upload-proxy.ts
 * for the full rationale (mirrors the product image-upload route).
 *
 * IMPORTANT: this is a STATIC route (promotionId comes via `?promotionId=`,
 * not a `[id]` path segment) on purpose — a dynamic handler would be
 * swallowed by the catch-all `/api/*` rewrite (afterFiles ordering).
 */

export const runtime = "nodejs";
// Raise the ceiling well above the edge proxy's ~30s window. Vercel clamps this
// to the plan max (60s Hobby, up to 300s Pro); bump it if the backend needs more.
export const maxDuration = 60;

export async function POST(req: Request) {
  const promotionId = new URL(req.url).searchParams.get("promotionId");
  if (!promotionId) {
    return NextResponse.json(
      { success: false, message: "Missing promotionId." },
      { status: 400 },
    );
  }
  return proxyUploadToBackend(
    req,
    `/v1/promotions/${promotionId}/slides`,
    maxDuration,
  );
}

/**
 * In-place image replacement for a single slide. The backend's
 * `PATCH /:id/slides/:slideId` accepts multipart as well as JSON and swaps
 * `file` / `mobileFile` upload-then-delete, so a failed upload never leaves a
 * slide imageless.
 *
 * It shares this route rather than getting its own because `slideId` has to
 * arrive as a query param for the same reason `promotionId` does — a `[id]`
 * segment here would be swallowed by the catch-all `/api/*` rewrite. A
 * metadata-only edit does NOT come through here; that stays a plain JSON PATCH
 * straight to the backend.
 */
export async function PATCH(req: Request) {
  const params = new URL(req.url).searchParams;
  const promotionId = params.get("promotionId");
  const slideId = params.get("slideId");
  if (!promotionId || !slideId) {
    return NextResponse.json(
      { success: false, message: "Missing promotionId or slideId." },
      { status: 400 },
    );
  }
  return proxyUploadToBackend(
    req,
    `/v1/promotions/${promotionId}/slides/${slideId}`,
    maxDuration,
    "PATCH",
  );
}
