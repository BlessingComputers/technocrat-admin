import type { StaffNotification } from "../types/notification";

/** Per-type glyph for the notification list — all already in the offline subset. */
export function notificationIcon(type: StaffNotification["type"]): string {
  switch (type) {
    case "LOW_STOCK_ALERT":
      return "solar:box-minimalistic-linear";
    case "NEW_ORDER":
      return "solar:cart-large-2-linear";
    case "PRICE_CONFIRMATION_NEEDED":
      return "solar:tag-price-linear";
    case "ORDER_STATUS_UPDATE":
      return "solar:box-linear";
    case "PAYMENT_RECEIVED":
      return "solar:wallet-linear";
    case "PAYMENT_FAILED":
      return "solar:card-linear";
    case "ACCOUNT_UPDATE":
      return "solar:user-linear";
    case "SECURITY_ALERT":
      return "solar:shield-warning-linear";
    case "UPLOAD_TARGET_SET":
      return "solar:cloud-upload-linear";
    case "GENERAL":
    default:
      return "solar:bell-linear";
  }
}
