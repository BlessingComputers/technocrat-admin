import { TEMPLATES, type TemplateKey } from "../constants/placements";

export interface Dimensions {
  w: number;
  h: number;
}

export type FitStatus =
  /** Exactly the template's export size. The happy path (§2.9). */
  | "exact"
  /** Right shape, wrong pixels — scales cleanly, nothing is cut. */
  | "scaled"
  /** Same shape but smaller than the export size — will look soft. */
  | "soft"
  /** Wrong shape. Something gets cropped. */
  | "mismatch";

export interface FitAssessment {
  status: FitStatus;
  /** How far off the target ratio, as a fraction. 0.12 = 12% wrong. */
  ratioDelta: number;
  /** Staff-facing sentence. Never blocks the upload — the judgement stays theirs. */
  message: string;
}

/**
 * Beyond this the shape is wrong enough that a headline near an edge starts
 * getting cut. Plan §2.9 sets it at "~5%".
 */
export const RATIO_TOLERANCE = 0.05;

/**
 * Below this fraction of the target width the file is too small to scale up
 * cleanly. The measuring pass put the desktop exports at only ~1.97× on a
 * retina screen at the xl step, so there is no headroom to give away: a file
 * three quarters of the export size lands under 1.5× and shows it.
 */
const SOFT_THRESHOLD = 0.75;

function describeCrop(actual: Dimensions, target: Dimensions): string {
  // Wider than the target ratio means the sides come off; taller means the top
  // and bottom do. Saying which edge is the useful half of the warning.
  const actualRatio = actual.w / actual.h;
  const targetRatio = target.w / target.h;
  return actualRatio > targetRatio
    ? "the left and right edges will be cropped"
    : "the top and bottom will be cropped";
}

/**
 * Compare an uploaded file's real pixel size against a template's export size.
 *
 * Nothing here blocks anything. The uploader shows the verdict and lets staff
 * upload anyway (§2.9) — the crop tool that would fix a mismatch properly is
 * phase 7, and until then `object-cover` on the storefront is the behaviour
 * being described.
 */
export function assessFit(
  actual: Dimensions,
  target: Dimensions,
): FitAssessment {
  const actualRatio = actual.w / actual.h;
  const targetRatio = target.w / target.h;
  const ratioDelta = Math.abs(actualRatio / targetRatio - 1);

  if (ratioDelta > RATIO_TOLERANCE) {
    return {
      status: "mismatch",
      ratioDelta,
      message: `Wrong shape for this slot — ${describeCrop(actual, target)}.`,
    };
  }

  if (actual.w === target.w && actual.h === target.h) {
    return {
      status: "exact",
      ratioDelta: 0,
      message: "Exact size for this slot.",
    };
  }

  if (actual.w < target.w * SOFT_THRESHOLD) {
    return {
      status: "soft",
      ratioDelta,
      message: `Right shape, but smaller than ${target.w} × ${target.h} — it will look soft on a large screen.`,
    };
  }

  return {
    status: "scaled",
    ratioDelta,
    message: "Right shape — it will be scaled to fit.",
  };
}

/** The desktop export size a placement's template expects. */
export function desktopTarget(template: TemplateKey): Dimensions {
  return TEMPLATES[template].desktop;
}

/** The mobile export size, or null for a template that takes one file. */
export function mobileTarget(template: TemplateKey): Dimensions | null {
  return TEMPLATES[template].mobile;
}

/**
 * Decode a chosen file far enough to read its pixel dimensions, without
 * uploading it. Resolves `null` for anything the browser cannot decode — a
 * corrupt file, or a rename that got past the MIME check.
 */
export function readImageSize(file: File): Promise<Dimensions | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
