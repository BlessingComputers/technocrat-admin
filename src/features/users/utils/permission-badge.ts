/**
 * Maps a permission name (e.g. `orders:read`) to a semantic Badge tone, so
 * permission pills read consistently in both themes via design tokens (ADR-0009)
 * instead of hardcoded palette colors.
 */
export type PermissionTone = "success" | "warning" | "danger" | "info";

export function permissionBadgeTone(name: string): PermissionTone {
  const lower = name.toLowerCase();
  if (lower.includes("read") || lower.includes("view")) return "success";
  if (
    lower.includes("write") ||
    lower.includes("update") ||
    lower.includes("edit") ||
    lower.includes("create")
  ) {
    return "warning";
  }
  if (lower.includes("delete") || lower.includes("remove")) return "danger";
  return "info";
}
