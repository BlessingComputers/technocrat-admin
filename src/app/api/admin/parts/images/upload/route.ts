import { NextResponse } from "next/server";
import { proxyUploadToBackend } from "@/lib/api/upload-proxy";

/**
 * Part image-upload proxy (single-part form). Mirrors the product image route:
 * routes the multipart upload through a Node serverless function instead of the
 * `/api/*` edge rewrite, whose ~30s window 504s the backend's upload+store
 * round-trip even for tiny files. See lib/api/upload-proxy.ts for the rationale.
 *
 * STATIC route (partId via `?partId=`, not a `[id]` segment) on purpose — Next.js
 * checks static filesystem routes BEFORE `afterFiles` rewrites but dynamic routes
 * AFTER, so a `[id]` handler would be swallowed by the catch-all `/api/*` rewrite.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const partId = new URL(req.url).searchParams.get("partId");
  if (!partId) {
    return NextResponse.json(
      { success: false, message: "Missing partId." },
      { status: 400 },
    );
  }
  return proxyUploadToBackend(
    req,
    `/v1/products/parts/${partId}/images`,
    maxDuration,
  );
}
