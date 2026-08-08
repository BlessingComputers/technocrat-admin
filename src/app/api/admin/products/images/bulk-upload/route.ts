import { proxyUploadToBackend } from "@/lib/api/upload-proxy";

/**
 * Bulk image-upload proxy (bulk-upload view). Same fix as the single-product
 * route: routes the multipart upload through a Node serverless function instead
 * of the `/api/*` edge rewrite, which 504s on Vercel. The `keys` form field is
 * carried through untouched as part of the raw multipart body. See
 * lib/api/upload-proxy.ts for the full rationale.
 */

export const runtime = "nodejs";
// Bulk uploads send several images per request, so give them the larger ceiling.
// Vercel clamps to the plan max (60s Hobby, up to 300s Pro).
export const maxDuration = 60;

export async function POST(req: Request) {
  return proxyUploadToBackend(req, `/v1/products/images/bulk-upload`, maxDuration);
}
