import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isAnimatedImage,
  isAnimatedImageBytes,
  prepareImageForUpload,
} from "./convert-image";

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
const u32le = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];

/**
 * A structurally valid GIF89a with `frames` image blocks, a global colour
 * table, a NETSCAPE loop extension and a graphic-control block per frame:
 * every block kind the walker has to step over.
 */
function gif(frames: number, { localColorTable = false } = {}): Uint8Array {
  const bytes = [
    ...ascii("GIF89a"),
    1, 0, 1, 0, // 1 × 1 canvas
    0x80, 0, 0, // global colour table, 2 entries
    0, 0, 0, 255, 255, 255,
    // NETSCAPE2.0 loop extension
    0x21, 0xff, 11, ...ascii("NETSCAPE2.0"), 3, 1, 0, 0, 0,
  ];
  for (let i = 0; i < frames; i += 1) {
    bytes.push(0x21, 0xf9, 4, 0, 10, 0, 0, 0); // graphic control, 100 ms
    bytes.push(0x2c, 0, 0, 0, 0, 1, 0, 1, 0, localColorTable ? 0x80 : 0);
    if (localColorTable) bytes.push(0, 0, 0, 255, 255, 255);
    bytes.push(2, 2, 0x4c, 0x01, 0); // LZW min size, one sub-block, terminator
  }
  bytes.push(0x3b);
  return new Uint8Array(bytes);
}

function chunk(fourcc: string, payload: number[]): number[] {
  const padded = payload.length % 2 ? [...payload, 0] : payload;
  return [...ascii(fourcc), ...u32le(payload.length), ...padded];
}

/** A RIFF/WEBP container holding `frames` ANMF chunks (0 = a still VP8L). */
function webp(frames: number): Uint8Array {
  const body =
    frames === 0
      ? chunk("VP8L", [0x2f, 0, 0, 0, 0])
      : [
          ...chunk("VP8X", [0x12, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
          ...chunk("ANIM", [0, 0, 0, 0, 0, 0]),
          ...Array.from({ length: frames }, () => chunk("ANMF", new Array(17).fill(0))).flat(),
        ];
  return new Uint8Array([...ascii("RIFF"), ...u32le(4 + body.length), ...ascii("WEBP"), ...body]);
}

const fileOf = (bytes: Uint8Array, name: string, type: string) =>
  new File([bytes as BlobPart], name, { type });

describe("isAnimatedImageBytes", () => {
  it("finds a GIF with more than one frame", () => {
    expect(isAnimatedImageBytes(gif(2))).toBe(true);
    expect(isAnimatedImageBytes(gif(30, { localColorTable: true }))).toBe(true);
  });

  it("treats a one-frame GIF as a still", () => {
    expect(isAnimatedImageBytes(gif(1))).toBe(false);
    expect(isAnimatedImageBytes(gif(1, { localColorTable: true }))).toBe(false);
  });

  it("finds a WebP with more than one ANMF frame", () => {
    expect(isAnimatedImageBytes(webp(2))).toBe(true);
  });

  it("treats a still or one-frame WebP as a still", () => {
    expect(isAnimatedImageBytes(webp(0))).toBe(false);
    expect(isAnimatedImageBytes(webp(1))).toBe(false);
  });

  it("returns false for other formats and for junk", () => {
    expect(isAnimatedImageBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(false);
    expect(isAnimatedImageBytes(new Uint8Array([0x89, ...ascii("PNG")]))).toBe(false);
    expect(isAnimatedImageBytes(new Uint8Array())).toBe(false);
    // A truncated GIF must not throw or read past the end.
    expect(isAnimatedImageBytes(gif(2).slice(0, 40))).toBe(false);
  });

  it("reads the bytes, not the MIME type or the name", async () => {
    expect(await isAnimatedImage(fileOf(gif(3), "banner.jpg", "image/jpeg"))).toBe(true);
    expect(await isAnimatedImage(fileOf(webp(0), "banner.gif", "image/gif"))).toBe(false);
  });
});

describe("prepareImageForUpload with an animated file", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the original file and never draws it to a canvas", async () => {
    // The canvas path starts with createImageBitmap; a call means one frame
    // is about to be kept and the rest thrown away.
    const createImageBitmap = vi.fn(() => Promise.reject(new Error("canvas path taken")));
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    // Over the byte budget, over the box and (for GIF) not an "uploadable"
    // type: each one alone sends a still down the canvas path.
    for (const file of [
      fileOf(gif(4), "promo.gif", "image/gif"),
      fileOf(webp(4), "promo.webp", "image/webp"),
    ]) {
      const out = await prepareImageForUpload(file, { box: { w: 1, h: 1 }, maxBytes: 1 });
      expect(out).toBe(file);
    }
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it("still sends a one-frame GIF down the canvas path", async () => {
    const createImageBitmap = vi.fn(() => Promise.reject(new Error("canvas path taken")));
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    await expect(
      prepareImageForUpload(fileOf(gif(1), "still.gif", "image/gif")),
    ).rejects.toThrow("canvas path taken");
    expect(createImageBitmap).toHaveBeenCalledOnce();
  });
});
