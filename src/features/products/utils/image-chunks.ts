/**
 * Split a list of files into request-sized batches.
 *
 * The admin app is on Vercel, whose proxy/serverless layer rejects request
 * bodies over ~4.5 MB — so a fixed "N images per request" batch blows the cap as
 * soon as a few full-resolution photos land together. Grouping by a SIZE budget
 * instead keeps every multipart request safely under the limit WITHOUT touching
 * image quality (originals upload as-is, just spread across more requests).
 *
 * A single file larger than the budget still gets its own request (best effort);
 * only a lone file over Vercel's hard cap can't be helped here — that case needs
 * presigned direct-to-Spaces uploads.
 */

/** ~4 MB — safely under Vercel's ~4.5 MB request-body limit, leaving headroom
 * for multipart boundaries and any sibling form fields (e.g. the `keys` JSON). */
export const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

/** Hard cap on files per request regardless of size, so tiny images don't pile
 * into one enormous multipart request. */
export const MAX_REQUEST_FILES = 10;

export function chunkBySize<T>(
  items: T[],
  sizeOf: (item: T) => number,
  maxBytes: number = MAX_REQUEST_BYTES,
  maxCount: number = MAX_REQUEST_FILES,
): T[][] {
  const chunks: T[][] = [];
  let current: T[] = [];
  let currentBytes = 0;

  for (const item of items) {
    const size = sizeOf(item);
    // Flush the current batch before it would exceed either budget — but never
    // flush an empty batch, so an oversized single file rides alone.
    if (
      current.length > 0 &&
      (currentBytes + size > maxBytes || current.length >= maxCount)
    ) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(item);
    currentBytes += size;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}
