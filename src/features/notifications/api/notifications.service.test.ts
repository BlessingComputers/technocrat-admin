/**
 * Guards the envelope handling for the one double-nested endpoint (`list`):
 * the shared client already unwraps `{ success, data }`, leaving
 * `{ data: StaffNotification[], meta }` — the service must still read the
 * inner `.data` for the array, same shape as `/admin/transactions`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const patch = vi.fn();
const del = vi.fn();
vi.mock("@/lib/api/client", () => ({
  api: {
    get: (...a: unknown[]) => get(...a),
    patch: (...a: unknown[]) => patch(...a),
    delete: (...a: unknown[]) => del(...a),
  },
}));

import { notificationsService } from "./notifications.service";
import type { StaffNotification } from "../types/notification";

beforeEach(() => {
  get.mockReset();
  patch.mockReset();
  del.mockReset();
});

const raw: StaffNotification = {
  id: "n1",
  type: "GENERAL",
  title: "Heads up",
  message: "Something happened",
  link: null,
  entityType: null,
  entityId: null,
  isRead: false,
  isImportant: false,
  createdAt: "2026-07-31T00:00:00.000Z",
};

describe("notificationsService.list", () => {
  it("reads the inner .data array out of the already-unwrapped { data, meta } payload", async () => {
    get.mockResolvedValue({
      data: [raw],
      meta: { total: 1, unreadCount: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const page = await notificationsService.list();

    expect(page.notifications).toEqual([raw]);
    expect(page.unreadCount).toBe(1);
    expect(page.total).toBe(1);
  });
});

describe("notificationsService.unreadCount", () => {
  it("returns the bare count", async () => {
    get.mockResolvedValue({ unreadCount: 7 });
    expect(await notificationsService.unreadCount()).toBe(7);
  });
});

describe("notificationsService.markAllRead", () => {
  it("returns the number updated", async () => {
    patch.mockResolvedValue({ updated: 3 });
    expect(await notificationsService.markAllRead()).toBe(3);
  });
});

describe("notificationsService.markRead", () => {
  it("PATCHes the per-notification read endpoint and returns the row", async () => {
    patch.mockResolvedValue({ ...raw, isRead: true });
    const result = await notificationsService.markRead("n1");
    expect(patch).toHaveBeenCalledWith(
      expect.stringContaining("/staff/notifications/n1/read"),
    );
    expect(result.isRead).toBe(true);
  });
});

describe("notificationsService.remove", () => {
  it("DELETEs the notification", async () => {
    del.mockResolvedValue(undefined);
    await notificationsService.remove("n1");
    expect(del).toHaveBeenCalledWith(
      expect.stringContaining("/staff/notifications/n1"),
    );
  });
});
