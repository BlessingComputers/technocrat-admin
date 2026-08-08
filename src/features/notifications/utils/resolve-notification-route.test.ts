import { describe, expect, it } from "vitest";
import { resolveNotificationRoute } from "./resolve-notification-route";
import type { StaffNotification } from "../types/notification";

function notification(
  overrides: Partial<
    Pick<StaffNotification, "entityType" | "entityId" | "link">
  >,
): Pick<StaffNotification, "entityType" | "entityId" | "link"> {
  return { entityType: null, entityId: null, link: null, ...overrides };
}

describe("resolveNotificationRoute", () => {
  it("PAYMENT + id → the payment detail route", () => {
    expect(
      resolveNotificationRoute(
        notification({ entityType: "PAYMENT", entityId: "PMT-1" }),
      ),
    ).toBe("/payments/PMT-1");
  });

  it("PAYMENT with no id → the payments list", () => {
    expect(
      resolveNotificationRoute(notification({ entityType: "PAYMENT" })),
    ).toBe("/payments");
  });

  it("PAYMENT_DLQ + null id → the DLQ list route (a collection target)", () => {
    expect(
      resolveNotificationRoute(notification({ entityType: "PAYMENT_DLQ" })),
    ).toBe("/payments/dlq");
  });

  it("PAYMENT_DLQ ignores a non-null id — it always points at the list", () => {
    expect(
      resolveNotificationRoute(
        notification({ entityType: "PAYMENT_DLQ", entityId: "job-1" }),
      ),
    ).toBe("/payments/dlq");
  });

  it("CHAT_CONVERSATION + id → the chat route, in our own URL shape", () => {
    expect(
      resolveNotificationRoute(
        notification({ entityType: "CHAT_CONVERSATION", entityId: "conv-1" }),
      ),
    ).toBe("/chat?c=conv-1");
  });

  it("CHAT_CONVERSATION with no id → null, not a guess", () => {
    expect(
      resolveNotificationRoute(
        notification({ entityType: "CHAT_CONVERSATION" }),
      ),
    ).toBeNull();
  });

  it("unknown entityType with a link → the link", () => {
    expect(
      resolveNotificationRoute(
        notification({ entityType: "SOMETHING_NEW", link: "/orders/o1" }),
      ),
    ).toBe("/orders/o1");
  });

  it("unknown entityType with no link → null", () => {
    expect(
      resolveNotificationRoute(notification({ entityType: "SOMETHING_NEW" })),
    ).toBeNull();
  });

  it("entityType: null with a link → the link", () => {
    expect(
      resolveNotificationRoute(notification({ link: "/orders/o2" })),
    ).toBe("/orders/o2");
  });

  it("everything null → null", () => {
    expect(resolveNotificationRoute(notification({}))).toBeNull();
  });
});
