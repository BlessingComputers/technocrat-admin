import type { SlideUpload } from "../types/promotions";

/**
 * Split a batch of slides into request-sized groups.
 *
 * Promotion slides used to go up as ONE multipart request no matter how many
 * there were — a `wide` carousel is six slides, each with an optional second
 * mobile file, so eleven full-size banners could share a single body. Vercel
 * rejects a request body over ~4.5 MB with a 413 before the function ever
 * runs, which is exactly what a prepared campaign hits. (Products and parts
 * solved the same problem with their own `chunkBySize`; features can't import
 * each other, so this is the promotions-shaped version of it.)
 *
 * A slide is the unit, never a file: `mobileIndexes` numbers a mobile file
 * against its desktop file's position *within the same request*, so splitting
 * a pair across two requests would orphan the mobile art.
 *
 * `prepareImageForUpload` runs before this and normally brings a whole
 * campaign under one request. This is the backstop for the case it can't fix:
 * enough slides that even compressed art adds up.
 */

/** ~3.5 MB — under Vercel's ~4.5 MB cap with room for boundaries and the
 * `metadata` JSON, which grows with the batch. */
export const MAX_REQUEST_BYTES = 3.5 * 1024 * 1024;

/** Hard ceiling on slides per request, so a batch of tiny files doesn't turn
 * into one long-running upload and trip the function's duration limit. */
export const MAX_REQUEST_SLIDES = 4;

/** Bytes a slide contributes to a request: its desktop art plus its mobile art. */
export function slideUploadBytes(upload: SlideUpload): number {
  return upload.file.size + (upload.mobileFile?.size ?? 0);
}

export function chunkSlideUploads(
  uploads: SlideUpload[],
  maxBytes: number = MAX_REQUEST_BYTES,
  maxCount: number = MAX_REQUEST_SLIDES,
): SlideUpload[][] {
  const chunks: SlideUpload[][] = [];
  let current: SlideUpload[] = [];
  let currentBytes = 0;

  for (const upload of uploads) {
    const bytes = slideUploadBytes(upload);
    // Flush before exceeding either budget, but never flush an empty group —
    // a single oversized slide rides alone and takes its chances.
    if (
      current.length > 0 &&
      (currentBytes + bytes > maxBytes || current.length >= maxCount)
    ) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(upload);
    currentBytes += bytes;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}
