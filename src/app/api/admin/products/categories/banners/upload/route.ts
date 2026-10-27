import { NextResponse } from "next/server";
import { proxyUploadToBackend } from "@/lib/api/upload-proxy";

/**
 * Category banner-upload proxy. Routes the multipart upload through a Node
 * serverless function instead of the `/api/*` edge rewrite, whose ~30s window
 * 504s the backend's upload+store round-trip on Vercel even for tiny files.
 * See lib/api/upload-proxy.ts for the full rationale.
 *
 * IMPORTANT: this is a STATIC route (categoryId comes via `?categoryId=`, not a
 * `[id]` path segment) on purpose. Next.js checks static filesystem routes
 * BEFORE `afterFiles` rewrites but dynamic routes AFTER them — so a `[id]`
 * handler would be swallowed by the catch-all `/api/*` rewrite and proxied to
 * the backend (→ 404). Keeping it static lets the handler win.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const categoryId = new URL(req.url).searchParams.get("categoryId");
  if (!categoryId) {
    return NextResponse.json(
      { success: false, message: "Missing categoryId." },
      { status: 400 },
    );
  }
  return proxyUploadToBackend(
    req,
    `/v1/products/categories/${categoryId}/banners`,
    maxDuration,
  );
}
