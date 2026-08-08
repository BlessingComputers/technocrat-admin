import { proxyUploadToBackend } from "@/lib/api/upload-proxy";

/**
 * Bulk part image-upload proxy (parts bulk-upload view). Same fix as the product
 * bulk route: routes the multipart upload through a Node serverless function
 * instead of the `/api/*` edge rewrite, which 504s. The `keys` form field rides
 * through untouched in the raw multipart body. See lib/api/upload-proxy.ts.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return proxyUploadToBackend(
    req,
    `/v1/products/parts/images/bulk-upload`,
    maxDuration,
  );
}
