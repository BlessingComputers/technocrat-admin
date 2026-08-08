import type { StaffNotification } from "../types/notification";

/**
 * The single place any `StaffNotification` becomes an admin-app URL (ticket
 * A6). No component may build a notification route inline — that defeats the
 * point of asking the backend for `entityType`/`entityId` instead of a
 * hardcoded `link` in the first place.
 *
 * Order: `entityType` + `entityId` → a route WE own; else `link` as-is
 * (app-relative, never an absolute URL); else `null`. An unresolvable
 * notification must render read-only, never guess — a wrong destination is
 * worse than no destination.
 *
 * `entityType` is currently populated only for the two payment-reliability
 * alerts; everything else (including live chat) falls back to `link` until
 * the backend extends it. The `CHAT_CONVERSATION`/`PAYMENT`/`PAYMENT_DLQ`
 * branches below are built ahead of that so they activate for free once it
 * does, and because we build the route ourselves rather than trust the
 * backend's path (our `/chat` route takes `?c=`, not `/chat/{id}`).
 *
 * `PAYMENT`/`PAYMENT_DLQ` point at ticket B1–B4's routes. If those haven't
 * landed yet the link 404s — acceptable and self-correcting (see A6 decision
 * doc); this resolver does not gate on whether the destination exists.
 */
export function resolveNotificationRoute(
  notification: Pick<StaffNotification, "entityType" | "entityId" | "link">,
): string | null {
  const { entityType, entityId, link } = notification;

  switch (entityType) {
    case "PAYMENT":
      return entityId ? `/payments/${entityId}` : "/payments";
    // A collection target — entityId is null by design (§ decision doc).
    case "PAYMENT_DLQ":
      return "/payments/dlq";
    case "CHAT_CONVERSATION":
      return entityId ? `/chat?c=${entityId}` : null;
    default:
      break;
  }

  // `link` was `format: uri` historically; it is now app-relative and no
  // longer carries a bogus prefix, so it's safe to use verbatim — but never
  // treat it as an absolute URL (no `new URL(...)`, no bare `<a href>`).
  if (link) return link;

  return null;
}
