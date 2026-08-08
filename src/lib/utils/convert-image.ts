/**
 * Browser-side image conversion.
 *
 * The backend and gallery only accept JPEG / PNG / WebP. Modern phones and
 * editors increasingly export AVIF, which browsers can *decode* but the
 * upload pipeline can't *store*. Renaming an `.avif` to `.jpg` does NOT
 * convert it — the bytes stay AVIF, so the file reads as corrupt and any
 * decoder that drops the alpha channel fills transparency with black.
 *
 * `convertToUploadableImage` does a real re-encode via canvas:
 *   - Downscales the longest edge to `MAX_DIMENSION` (keeps files small and
 *     under the backend's per-file limit; the backend caps at 1920 anyway).
 *   - Encodes to WebP, which is compact and keeps transparency. If the browser
 *     can't encode WebP from a canvas, it falls back to PNG (also alpha-safe),
 *     so transparent images never gain a black background.
 *
 * This is a client-only helper (uses `document`/`canvas`); call it from
 * client components only.
 */

/** MIME types the upload pipeline accepts as-is. */
const UPLOADABLE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Longest-edge cap. Matches/undercuts the backend resize target (1920). */
const MAX_DIMENSION = 2048;

/** WebP quality for re-encodes (0–1). */
const WEBP_QUALITY = 0.85;

/** Extension for each output MIME the browser may hand back. */
const EXT_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

function isUploadableType(type: string): boolean {
  return (UPLOADABLE_TYPES as readonly string[]).includes(type);
}

/** True if the file looks like AVIF by MIME type or extension. */
function isAvif(file: File): boolean {
  return file.type === "image/avif" || /\.avif$/i.test(file.name);
}

/** Swap a file's extension to match its new format. */
function renameExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^./\\]+$/, "");
  return `${base}.${ext}`;
}

/** Scale a size down so its longest edge is at most `max` (never enlarges). */
function fitWithin(width: number, height: number, max: number) {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Empty blob"))),
      type,
      quality,
    );
  });
}

/**
 * Ensure a file is in an uploadable format. AVIF (and anything the pipeline
 * can't store) is downscaled and re-encoded; already-uploadable files are
 * returned untouched.
 *
 * @throws if the browser cannot decode the image.
 */
export async function convertToUploadableImage(file: File): Promise<File> {
  // Already a real, accepted format — leave it alone. (AVIF is excluded even
  // if it was renamed to a .jpg extension, because the bytes are still AVIF.)
  if (isUploadableType(file.type) && !isAvif(file)) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_DIMENSION);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not get canvas 2D context for image conversion");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Prefer WebP (small, keeps alpha). Browsers without canvas WebP encoding
  // return a PNG blob instead — still alpha-safe, just larger.
  const blob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
  const outType = EXT_BY_TYPE[blob.type] ? blob.type : "image/png";
  const ext = EXT_BY_TYPE[outType];

  return new File([blob], renameExtension(file.name, ext), {
    type: outType,
    lastModified: Date.now(),
  });
}
