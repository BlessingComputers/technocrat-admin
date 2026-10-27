import { describe, expect, it } from "vitest";
import { TEMPLATES } from "../constants/placements";
import { RATIO_TOLERANCE, assessFit } from "./image-fit";

const BAND = TEMPLATES.band.desktop; // 2400 × 1000
const WIDE = TEMPLATES.wide.desktop; // 2400 × 1350
const HERO = TEMPLATES.hero.desktop; // 2560 × 1280

describe("assessFit", () => {
  it("calls an exact export exact", () => {
    const fit = assessFit({ w: 2400, h: 1000 }, BAND);
    expect(fit.status).toBe("exact");
    expect(fit.ratioDelta).toBe(0);
  });

  it("accepts the right shape at a bigger size", () => {
    // 3600 × 1500 is 12:5, same as band, just larger.
    expect(assessFit({ w: 3600, h: 1500 }, BAND).status).toBe("scaled");
  });

  it("flags the right shape at a size too small to scale up", () => {
    // 1200 × 500 is 12:5 but half the export width.
    const fit = assessFit({ w: 1200, h: 500 }, BAND);
    expect(fit.status).toBe("soft");
    expect(fit.message).toContain("2400 × 1000");
  });

  it("does not call a slightly-small file soft while it is still usable", () => {
    // 2000 × ~833 is 12:5 and above the 75% floor.
    expect(assessFit({ w: 2000, h: 833 }, BAND).status).toBe("scaled");
  });

  it("flags a 16:9 file dropped on a 12:5 slot", () => {
    const fit = assessFit({ w: 2400, h: 1350 }, BAND);
    expect(fit.status).toBe("mismatch");
    // 16:9 is TALLER than 12:5, so the top and bottom are what go.
    expect(fit.message).toContain("top and bottom");
  });

  it("flags a 12:5 file dropped on a 16:9 slot, and names the other axis", () => {
    const fit = assessFit({ w: 2400, h: 1000 }, WIDE);
    expect(fit.status).toBe("mismatch");
    expect(fit.message).toContain("left and right");
  });

  it("treats a portrait photo on the hero slot as a mismatch", () => {
    // The hero is 2:1 landscape; a phone photo is 3:4.
    expect(assessFit({ w: 1200, h: 1600 }, HERO).status).toBe("mismatch");
  });

  it("holds the tolerance boundary — just inside passes, just outside warns", () => {
    // band is 2.4; nudge the ratio to sit either side of ±5%.
    const inside = { w: Math.round(1000 * 2.4 * (1 + RATIO_TOLERANCE * 0.8)), h: 1000 };
    const outside = { w: Math.round(1000 * 2.4 * (1 + RATIO_TOLERANCE * 2)), h: 1000 };
    expect(assessFit(inside, BAND).status).not.toBe("mismatch");
    expect(assessFit(outside, BAND).status).toBe("mismatch");
  });

  it("never reports exact for the right pixels on the wrong template", () => {
    // The hero export is 2560 × 1280 (2:1); band is 12:5, 17% flatter. This is
    // the pair the hero's desktop ratio was chosen to keep apart — at the 16:7
    // it was first cut at, the two sat inside the ±5% tolerance and the
    // uploader would have called a hero file a clean fit for a band slot.
    expect(assessFit(HERO, BAND).status).toBe("mismatch");
  });
});
