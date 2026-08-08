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
