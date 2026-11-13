import { describe, expect, it } from "vitest";

import {
  foldLadder,
  impactKind,
  impactSentence,
  impactShort,
  ladderRows,
  sortImpactRows,
  summarizeImpact,
  type ImpactRow,
} from "./markup-impact";

const row = (id: string, current: number | null, projected: number | null, covered = false): ImpactRow => ({
  id,
  name: id,
  current,
  projected,
  covered,
});

const money = (n: number) => `₦${n.toLocaleString("en-NG")}`;
const noun = { one: "variant", many: "variants" };

describe("impactKind", () => {
  it("keeps a covered row unless replace is on", () => {
    expect(impactKind(row("a", 100, 120, true), false)).toBe("kept");
    expect(impactKind(row("a", 100, 120, true), true)).toBe("up");
    expect(impactKind(row("a", 150, 120, true), true)).toBe("down");
  });

  it("treats a part with no price yet as going up", () => {
    expect(impactKind(row("a", null, 120), false)).toBe("up");
    expect(impactKind(row("a", 120, 120), false)).toBe("same");
  });
});

describe("summarizeImpact and sortImpactRows", () => {
  const rows = [
    row("kept", 100, 110, true),
    row("same", 100, 100),
    row("up1", 100, 110),
    row("down", 200, 150, true),
    row("up2", 100, 130),
  ];

  it("splits the rows and averages the deltas", () => {
    expect(summarizeImpact(rows, false)).toEqual({
      total: 5, up: 2, down: 0, same: 1, kept: 2, takenOver: 0, avgUp: 20, avgDown: 0,
    });
    expect(summarizeImpact(rows, true)).toMatchObject({
      up: 3, down: 1, kept: 0, takenOver: 2, avgDown: 50,
    });
  });

  it("puts changing rows first and keeps server order inside a group", () => {
    expect(sortImpactRows(rows, false).map((r) => r.id)).toEqual(["up1", "up2", "same", "kept", "down"]);
    expect(sortImpactRows(rows, true).map((r) => r.id)).toEqual(["kept", "up1", "down", "up2", "same"]);
  });
});

describe("impactSentence", () => {
  it("reads as a rise when nothing goes down", () => {
    const s = summarizeImpact([row("a", 100, 110), row("b", 100, 130), row("c", 1, 2, true)], false);
    expect(impactSentence(s, noun, money, false)).toEqual({
      lead: "2 variants",
      rest: " go up, by ₦20 on average.",
      sub: "1 keeps another rule.",
    });
    expect(impactShort(s)).toEqual(["2 go up", "1 keep another rule"]);
  });

  it("counts both directions and the rows a replace takes over", () => {
    const s = summarizeImpact([row("a", 100, 110, true), row("b", 200, 150)], true);
    expect(impactSentence(s, noun, money, true)).toEqual({
      lead: "2 variants",
      rest: " change price: 1 go up, 1 go down.",
      sub: "1 of them is priced by a rule you turn off.",
    });
  });

  it("says so when no price moves", () => {
    const s = summarizeImpact([row("a", 100, 100)], false);
    expect(impactSentence(s, noun, money, false).lead).toBe("No prices change.");
  });
});

describe("ladderRows and foldLadder", () => {
  const tiers = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
    { key: "d", label: "D" },
    { key: "e", label: "E" },
  ] as const;
  const rules = [
    { tier: "a" as const, label: "x", percentage: 5 },
    { tier: "a" as const, label: "y", percentage: 6 },
    { tier: "e" as const, label: "z", percentage: 7 },
  ];

  it("marks tiers above and below the rule's own tier, with counts", () => {
    const rows = ladderRows(tiers, "c", rules, false);
    expect(rows.map((r) => [r.key, r.relation, r.activeCount])).toEqual([
      ["a", "above", 2], ["b", "above", 0], ["c", "self", 0], ["d", "below", 0], ["e", "below", 1],
    ]);
    expect(rows.every((r) => r.turnsOff.length === 0)).toBe(true);
  });

  it("lists the rules that turn off when replace is on", () => {
    const rows = ladderRows(tiers, "e", rules.slice(0, 2), true);
    expect(rows[0].turnsOff.map((r) => r.label)).toEqual(["x", "y"]);
  });

  it("folds to the own tier plus one each side, and tiers with rules turning off", () => {
    const rows = ladderRows(tiers, "c", rules, false);
    expect(foldLadder(rows, false)).toMatchObject({ hidden: 2 });
    expect(foldLadder(rows, false).visible.map((r) => r.key)).toEqual(["b", "c", "d"]);
    expect(foldLadder(rows, true).hidden).toBe(0);
    const replaced = ladderRows(tiers, "e", rules.slice(0, 2), true);
    expect(foldLadder(replaced, false).visible.map((r) => r.key)).toEqual(["a", "d", "e"]);
  });
});
