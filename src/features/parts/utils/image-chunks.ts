/**
 * Split files into request-sized batches (parts-local copy of the product util —
 * features can't import each other). Groups by a SIZE budget so a multipart
 * request stays under Vercel's ~4.5 MB body cap without touching image quality.
 */

export const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
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
