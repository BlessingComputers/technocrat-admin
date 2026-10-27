import { describe, expect, it } from "vitest";
import {
  MAX_REQUEST_BYTES,
  MAX_REQUEST_SLIDES,
  chunkSlideUploads,
  slideUploadBytes,
} from "./slide-chunks";
import type { SlideUpload } from "../types/promotions";

/** A stand-in for a File — only `size` matters to the chunker. */
const fileOf = (bytes: number) => ({ size: bytes }) as File;

function slide(desktopBytes: number, mobileBytes?: number): SlideUpload {
  return {
    file: fileOf(desktopBytes),
    mobileFile: mobileBytes === undefined ? null : fileOf(mobileBytes),
    metadata: {},
  };
}

const MB = 1024 * 1024;

describe("slideUploadBytes", () => {
  it("counts both files of a slide", () => {
    expect(slideUploadBytes(slide(3, 4))).toBe(7);
  });

  it("counts only the desktop file when there is no mobile recut", () => {
    expect(slideUploadBytes(slide(3))).toBe(3);
  });
});

describe("chunkSlideUploads", () => {
  it("keeps a small batch in one request", () => {
    const uploads = [slide(0.2 * MB), slide(0.2 * MB), slide(0.2 * MB)];
    expect(chunkSlideUploads(uploads)).toHaveLength(1);
  });

  it("splits before a group would exceed the byte budget", () => {
    // Four slides at 1.5 MB: 3.5 MB fits two, not three.
    const uploads = [
      slide(1.5 * MB),
      slide(1.5 * MB),
      slide(1.5 * MB),
      slide(1.5 * MB),
    ];
    const chunks = chunkSlideUploads(uploads);
    expect(chunks.map((c) => c.length)).toEqual([2, 2]);
    for (const chunk of chunks) {
      const bytes = chunk.reduce((sum, u) => sum + slideUploadBytes(u), 0);
      expect(bytes).toBeLessThanOrEqual(MAX_REQUEST_BYTES);
    }
  });

  it("counts a slide's mobile file toward the budget", () => {
    // 2 MB desktop + 2 MB mobile is 4 MB — over budget on its own, so each
    // slide has to travel alone.
    const uploads = [slide(2 * MB, 2 * MB), slide(2 * MB, 2 * MB)];
    expect(chunkSlideUploads(uploads).map((c) => c.length)).toEqual([1, 1]);
  });

  it("never splits a slide from its own mobile file", () => {
    const uploads = [slide(1 * MB, 1 * MB), slide(1 * MB, 1 * MB)];
    for (const chunk of chunkSlideUploads(uploads)) {
      for (const upload of chunk) {
        expect(upload.metadata).toBeDefined();
        // The pair is a single item — there is no shape in which one half
        // lands in another request.
        expect(uploads).toContain(upload);
      }
    }
  });

  it("caps a batch of tiny files by count", () => {
    const uploads = Array.from({ length: 9 }, () => slide(1024));
    expect(chunkSlideUploads(uploads).map((c) => c.length)).toEqual([
      MAX_REQUEST_SLIDES,
      MAX_REQUEST_SLIDES,
      1,
    ]);
  });

  it("lets a single oversized slide ride alone rather than dropping it", () => {
    const chunks = chunkSlideUploads([slide(10 * MB)]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(1);
  });

  it("preserves order across requests", () => {
    const uploads = Array.from({ length: 7 }, (_, i) => slide(1024 * (i + 1)));
    expect(chunkSlideUploads(uploads).flat()).toEqual(uploads);
  });

  it("returns nothing for an empty batch", () => {
    expect(chunkSlideUploads([])).toEqual([]);
  });
});
