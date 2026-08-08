/**
 * React Query key namespace for the staff-notification feed (ticket A6).
 * Lives in `lib/` (not `features/notifications/`) because the chat socket
 * hook needs to invalidate it too, and features cannot import each other
 * (see `eslint.config.mjs` boundary rules) — this is the shared contract
 * point instead of a cross-feature import.
 */
export const notificationKeys = {
  all: ["staff-notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};
