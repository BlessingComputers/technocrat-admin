import { describe, expect, it } from "vitest";
import type { HuntCampaign, HuntDeal } from "../types/hunts";
import {
  claimCounts,
  claimLine,
  currentSlot,
  discountNeverApplied,
  isMonitorLive,
  isUnpaidClaim,
  nextDrop,
  paymentLabel,
  releaseNote,
  slotPhase,
  sortForWinners,
} from "./hunt-rows";
import { formatHuntClock } from "./hunt-time";

const at = (iso: string) => new Date(iso).getTime();

// One drop: countdown public at 1:30 pm WAT, live 1:40 to 1:45 pm WAT.
function huntDeal(overrides: Partial<HuntDeal> = {}): HuntDeal {
  return {
    id: "hd-1",
    dealId: "deal-1",
    productId: "prod-1",
    productName: "iPhone 15",
    markupPercentage: -99,
    discountApplied: true,
    revealAt: "2026-09-12T12:30:00.000Z",
    slotStart: "2026-09-12T12:40:00.000Z",
    slotEnd: "2026-09-12T12:45:00.000Z",
    claimStatus: "OPEN",
    heldByOrderId: null,
    heldByCustomerId: null,
    heldByCustomerName: null,
    heldAt: null,
    claimedAt: null,
    releasedAt: null,
    releaseReason: null,
    orderPaymentStatus: null,
    orderNumber: null,
    ...overrides,
  };
}

const HELD = {
  claimStatus: "HELD",
  heldByOrderId: "order-1",
  heldByCustomerId: "cust-1",
  heldByCustomerName: "Chidi Okafor",
  heldAt: "2026-09-12T12:41:00.000Z",
  orderNumber: "ORD-1001",
  orderPaymentStatus: "PENDING",
} as const satisfies Partial<HuntDeal>;

// Window noon to four, WAT.
function campaign(overrides: Partial<HuntCampaign> = {}): HuntCampaign {
  return {
    id: "c-1",
    campaignId: "HUNT-ABCD1234",
    name: "Saturday hunt",
    windowStart: "2026-09-12T11:00:00.000Z",
    windowEnd: "2026-09-12T15:00:00.000Z",
    status: "SCHEDULED",
    huntDeals: [],
    createdAt: "2026-09-10T09:00:00.000Z",
    updatedAt: "2026-09-10T09:00:00.000Z",
    ...overrides,
  };
}

describe("slotPhase", () => {
  it("walks secret, revealed, live, over, with slotEnd exclusive", () => {
    const deal = huntDeal();
    expect(slotPhase(deal, at("2026-09-12T12:20:00.000Z"))).toBe("secret");
    expect(slotPhase(deal, at("2026-09-12T12:35:00.000Z"))).toBe("revealed");
    expect(slotPhase(deal, at("2026-09-12T12:40:00.000Z"))).toBe("live");
    expect(slotPhase(deal, at("2026-09-12T12:45:00.000Z"))).toBe("over");
  });
});

describe("claimLine", () => {
  it("gives a held drop's release time, heldAt plus 15 minutes", () => {
    const line = claimLine(huntDeal(HELD), at("2026-09-12T12:50:00.000Z"));
    expect(line).toEqual({
      text: `Held by Chidi Okafor, awaiting payment, releases at ${formatHuntClock(
        "2026-09-12T12:56:00.000Z",
      )}`,
      tone: "warning",
    });
  });

  it("says the hold ran out once the deadline passes", () => {
    const line = claimLine(huntDeal(HELD), at("2026-09-12T12:57:00.000Z"));
    expect(line.text).toBe(
      `Held by Chidi Okafor, unpaid. The hold ran out at ${formatHuntClock(
        "2026-09-12T12:56:00.000Z",
      )} and is being released`,
    );
  });

  it("does not invent a deadline without heldAt, or a name without one", () => {
    const line = claimLine(
      huntDeal({ ...HELD, heldAt: null, heldByCustomerName: null }),
      at("2026-09-12T12:50:00.000Z"),
    );
    expect(line.text).toBe("Held by a customer, awaiting payment");
  });

  it("reads a paid claim differently from a hold", () => {
    const line = claimLine(
      huntDeal({ ...HELD, claimStatus: "CLAIMED", orderPaymentStatus: "PAID" }),
      at("2026-09-12T13:30:00.000Z"),
    );
    expect(line).toEqual({ text: "Won by Chidi Okafor, paid", tone: "success" });
  });

  it("describes an open drop by where the clock is", () => {
    const deal = huntDeal();
    expect(claimLine(deal, at("2026-09-12T12:20:00.000Z")).text).toBe(
      `Secret. The countdown goes public at ${formatHuntClock(deal.revealAt)}`,
    );
    expect(claimLine(deal, at("2026-09-12T12:35:00.000Z")).text).toBe(
      `Countdown is public. Drops at ${formatHuntClock(deal.slotStart)}`,
    );
    expect(claimLine(deal, at("2026-09-12T12:42:00.000Z")).text).toBe(
      "Live now. Nobody has claimed it yet",
    );
    expect(claimLine(deal, at("2026-09-12T12:50:00.000Z")).text).toBe(
      "Not won. The drop closed unclaimed",
    );
  });
});

describe("releaseNote", () => {
  const released = { releasedAt: "2026-09-12T12:56:00.000Z" };

  it("is null for a drop never released", () => {
    expect(releaseNote(huntDeal())).toBeNull();
  });

  it("puts the two system codes into words", () => {
    expect(releaseNote(huntDeal({ ...released, releaseReason: "PAYMENT_FAILED" }))?.text).toBe(
      "Released automatically: payment failed",
    );
    expect(releaseNote(huntDeal({ ...released, releaseReason: "HOLD_TIMEOUT" }))?.text).toBe(
      "Released automatically: the winner did not finish in time",
    );
  });

  it("quotes a staff member's own reason", () => {
    expect(
      releaseNote(huntDeal({ ...released, releaseReason: "Out of stock at the branch" }))?.text,
    ).toBe("Released by staff: “Out of stock at the branch”");
  });

  it("survives the drop being held again", () => {
    const note = releaseNote(huntDeal({ ...HELD, ...released, releaseReason: "HOLD_TIMEOUT" }));
    expect(note).toEqual({
      text: "Released automatically: the winner did not finish in time",
      at: released.releasedAt,
    });
  });
});

describe("sortForWinners", () => {
  it("puts unpaid claims first, then paid, then unsold, each by slot", () => {
    const paid = huntDeal({
      ...HELD,
      id: "paid",
      claimStatus: "CLAIMED",
      orderPaymentStatus: "PAID",
      slotStart: "2026-09-12T11:20:00.000Z",
    });
    const unsold = huntDeal({ id: "unsold", slotStart: "2026-09-12T11:50:00.000Z" });
    const held = huntDeal({ ...HELD, id: "held", slotStart: "2026-09-12T14:10:00.000Z" });
    const refunded = huntDeal({
      ...HELD,
      id: "refunded",
      claimStatus: "CLAIMED",
      orderPaymentStatus: "REFUNDED",
      slotStart: "2026-09-12T13:00:00.000Z",
    });

    expect(sortForWinners([paid, unsold, held, refunded]).map((d) => d.id)).toEqual([
      "refunded",
      "held",
      "paid",
      "unsold",
    ]);
  });

  it("treats only a PAID order as settled", () => {
    expect(isUnpaidClaim(huntDeal(HELD))).toBe(true);
    expect(isUnpaidClaim(huntDeal({ ...HELD, orderPaymentStatus: "PAID" }))).toBe(false);
    expect(isUnpaidClaim(huntDeal())).toBe(false);
  });
});

describe("drops in time", () => {
  const first = huntDeal({
    id: "first",
    revealAt: "2026-09-12T11:10:00.000Z",
    slotStart: "2026-09-12T11:20:00.000Z",
    slotEnd: "2026-09-12T11:25:00.000Z",
  });
  const second = huntDeal({ id: "second" });
  const deals = [second, first];

  it("finds the open slot and the next one, whatever order they arrive in", () => {
    const now = at("2026-09-12T11:22:00.000Z");
    expect(currentSlot(deals, now)?.id).toBe("first");
    expect(nextDrop(deals, now)?.id).toBe("second");
  });

  it("has neither after the last slot", () => {
    const now = at("2026-09-12T13:00:00.000Z");
    expect(currentSlot(deals, now)).toBeUndefined();
    expect(nextDrop(deals, now)).toBeUndefined();
  });

  it("counts claims and holds", () => {
    expect(
      claimCounts([
        huntDeal(HELD),
        huntDeal({ ...HELD, claimStatus: "CLAIMED" }),
        huntDeal(),
      ]),
    ).toEqual({ total: 3, claimed: 1, held: 1 });
  });
});

describe("discountNeverApplied", () => {
  const unapplied = huntDeal({ discountApplied: false });

  it("stays quiet before the slot, and for a minute after it opens", () => {
    expect(discountNeverApplied(unapplied, at("2026-09-12T12:30:00.000Z"))).toBe(false);
    expect(discountNeverApplied(unapplied, at("2026-09-12T12:40:30.000Z"))).toBe(false);
  });

  it("flags a drop still reporting 0 once the start has had its minute", () => {
    expect(discountNeverApplied(unapplied, at("2026-09-12T12:41:00.000Z"))).toBe(true);
  });

  it("never flags a drop whose rule carries the discount", () => {
    expect(discountNeverApplied(huntDeal(), at("2026-09-12T13:30:00.000Z"))).toBe(false);
  });
});

describe("isMonitorLive", () => {
  const beforeWindow = at("2026-09-12T10:00:00.000Z");
  const inWindow = at("2026-09-12T12:00:00.000Z");

  it("polls an active campaign", () => {
    expect(isMonitorLive(campaign({ status: "ACTIVE" }), inWindow)).toBe(true);
  });

  it("polls a scheduled campaign only once its window has opened", () => {
    expect(isMonitorLive(campaign(), beforeWindow)).toBe(false);
    expect(isMonitorLive(campaign(), inWindow)).toBe(true);
  });

  it("polls an ended campaign only while a hold is running out", () => {
    expect(isMonitorLive(campaign({ status: "ENDED", huntDeals: [huntDeal()] }), inWindow)).toBe(
      false,
    );
    expect(
      isMonitorLive(campaign({ status: "ENDED", huntDeals: [huntDeal(HELD)] }), inWindow),
    ).toBe(true);
  });
});

describe("paymentLabel", () => {
  it("sentence-cases the status and names a missing order", () => {
    expect(paymentLabel("PAID")).toBe("Paid");
    expect(paymentLabel("PROOF_UPLOADED")).toBe("Proof uploaded");
    expect(paymentLabel(null)).toBe("No order");
  });
});
