import { ApiError } from "@/lib/api/error";

/**
 * True when a create/update failed because the email is already on the list.
 *
 * The backend throws a `ConflictError` for exactly one reason on these two
 * routes — a clash on the unique `email` column — so the status alone is enough
 * to attribute it to the email field. If a second 409 cause is ever added
 * there, this needs to start reading the message.
 */
export function isDuplicateEmailError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}
