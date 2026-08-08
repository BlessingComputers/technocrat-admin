/**
 * The status enum is hand-authored, not generated, so a future backend
 * widening (another value the union doesn't admit) previously hit a direct
 * `Record` index and returned `undefined` — this is the test that would have
 * made the "is it a crash" question moot (ticket A3).
 */

import { describe, expect, it } from "vitest";

import {
  getMessageStatusMeta,
  MESSAGE_STATUS_META,
} from "./whatsapp-status";
import type { WhatsAppMessageStatus } from "../types/whatsapp";

describe("getMessageStatusMeta", () => {
  it("returns the known entry for a status in the union", () => {
    expect(getMessageStatusMeta("READ")).toBe(MESSAGE_STATUS_META.READ);
  });

  it("falls back to a neutral entry for an unknown status instead of throwing", () => {
    const meta = getMessageStatusMeta(
      "SOMETHING_NEW" as WhatsAppMessageStatus,
    );

    expect(meta).toBeDefined();
    expect(meta.label).toBe("Unknown status");
  });

  it("gives SHADOW a distinct entry, not a delivery tick", () => {
    const meta = getMessageStatusMeta("SHADOW");

    expect(meta.icon).not.toBe(MESSAGE_STATUS_META.SENT.icon);
    expect(meta.icon).not.toBe(MESSAGE_STATUS_META.READ.icon);
    expect(meta.label.toLowerCase()).toContain("shadow");
  });
});
