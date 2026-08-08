import { proxyUploadToBackend } from "@/lib/api/upload-proxy";

/**
 * Multipart product-create proxy. `POST /api/v1/products` accepts the product
 * fields AND its first images in one request, so creating a product with a
 * gallery no longer needs a save-then-upload round trip.
 *
 * It goes through a Node serverless function rather than the `/api/*` edge
 * rewrite for the same reason the image routes do: the rewrite's ~30s window
 * 504s the backend's upload+store round-trip on Vercel. See
 * lib/api/upload-proxy.ts.
 *
 * Static route on purpose (no `[id]` segment) — dynamic routes are matched
 * AFTER `afterFiles` rewrites and would be swallowed by the catch-all.
 */

export const runtime = "nodejs";
// Matches the image-upload route: well above the edge proxy's ~30s window,
// clamped by Vercel to the plan max.
export const maxDuration = 60;

export async function POST(req: Request) {
  return proxyUploadToBackend(req, "/v1/products", maxDuration);
}
