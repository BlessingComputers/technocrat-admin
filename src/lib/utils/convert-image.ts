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

/**
 * Scale a size down so it fits *inside* a `maxW × maxH` box, keeping its
 * aspect ratio and never enlarging.
 *
 * A longest-edge cap is the wrong tool when the target is not square: a
 * 2400 × 1000 `band` and a 1200 × 1200 `tile` have very different pixel
 * budgets even though one number describes both.
 */
function fitInsideBox(width: number, height: number, maxW: number, maxH: number) {
  const scale = Math.min(1, maxW / width, maxH / height);
  if (scale >= 1) return { width, height };
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

/**
 * Cap for a caller that names no target box. Generous on purpose — a caller
 * that knows the size the image will be displayed or stored at should pass
 * `box` and get a real reduction; this is only a backstop against a 6000px
 * camera original.
 */
const DEFAULT_MAX_DIMENSION = 2400;

/**
 * Byte budget above which an already-correctly-sized image is still
 * re-encoded. A camera JPEG or an exported PNG at banner dimensions is
 * routinely 3–8 MB of data that WebP stores in a few hundred KB with no
 * visible difference at these sizes.
 */
const DEFAULT_MAX_BYTES = 700 * 1024;

export interface PrepareImageOptions {
  /**
   * The pixel box the image should fit inside. Pass a template's export size
   * when one is known; omitted, the image is capped at `DEFAULT_MAX_DIMENSION`
   * on both axes. The image is never enlarged.
   */
  box?: { w: number; h: number } | null;
  /** Re-encode an in-box image once it is larger than this many bytes. */
  maxBytes?: number;
  /** WebP quality for the re-encode (0–1). */
  quality?: number;
}

/**
 * Shrink a file to something a multipart request can actually carry.
 *
 * `convertToUploadableImage` only re-encodes what the pipeline cannot store
 * (AVIF), which is the right call for a product photo: the backend keeps the
 * original and the gallery wants every pixel. Banner art is the opposite case
 * — it is displayed at one known size, and the whole carousel is uploaded in
 * one request that Vercel rejects at ~4.5 MB. So this variant re-encodes on
 * *size* as well as on format:
 *
 *   - downscale to fit `box` (never up),
 *   - re-encode to WebP (compact, keeps alpha; PNG where WebP encoding is
 *     unavailable, so transparency never turns black),
 *   - leave the file untouched when it is already small enough and in an
 *     accepted format.
 *
 * The original is also kept when the re-encode comes out no smaller, so a
 * well-optimised export is never made worse.
 *
 * Client-only (uses `document`/`canvas`).
 */
export async function prepareImageForUpload(
  file: File,
  { box, maxBytes = DEFAULT_MAX_BYTES, quality = WEBP_QUALITY }: PrepareImageOptions = {},
): Promise<File> {
  // Format alone can force the re-encode, regardless of how small the file is.
  const mustConvert = !isUploadableType(file.type) || isAvif(file);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    // An undecodable file is a problem for the caller, not for us to paper
    // over — unless the format was fine, in which case send the bytes as-is
    // and let the backend have the last word.
    if (mustConvert) throw error;
    return file;
  }

  const maxW = box?.w ?? DEFAULT_MAX_DIMENSION;
  const maxH = box?.h ?? DEFAULT_MAX_DIMENSION;
  const { width, height } = fitInsideBox(bitmap.width, bitmap.height, maxW, maxH);
  const oversized = width < bitmap.width || height < bitmap.height;

  if (!mustConvert && !oversized && file.size <= maxBytes) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    if (!mustConvert) return file;
    throw new Error("Could not get canvas 2D context for image conversion");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvasToBlob(canvas, "image/webp", quality);
  const outType = EXT_BY_TYPE[blob.type] ? blob.type : "image/png";
  const ext = EXT_BY_TYPE[outType];

  // Re-encoding a small, already-efficient file can grow it. Only accept the
  // result when it actually helps, or when the format left us no choice.
  if (!mustConvert && !oversized && blob.size >= file.size) {
    return file;
  }

  return new File([blob], renameExtension(file.name, ext), {
    type: outType,
    lastModified: Date.now(),
  });
}
