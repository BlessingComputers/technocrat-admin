/**
 * Moved to `lib/hooks/use-current-staff-id` — the WhatsApp inbox needs the same
 * identity and features may not import from each other. Re-exported here so the
 * chat slice's existing call sites keep working.
 */
export { useCurrentStaffId } from "@/lib/hooks/use-current-staff-id";
