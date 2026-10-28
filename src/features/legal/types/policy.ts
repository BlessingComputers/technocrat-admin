/**
 * The checkout policy registry (backend `policy` module).
 *
 * A version is published, never edited. `PolicyConsent` rows on past orders
 * point at one, so changing it after the fact would rewrite what a customer
 * agreed to. Publishing a new version flips `isCurrent` and leaves the old row
 * exactly as it was.
 */
export interface PolicyVersion {
  /** Human label, and the string checkout echoes back. Unique. */
  version: string;
  /** SHA-256 of `contentText`, so a stored archive can be proven unaltered. */
  contentHash: string;
  contentText: string | null;
  archiveUrl: string | null;
  isCurrent: boolean;
  /** ISO timestamp. */
  publishedAt: string;
}

export interface PublishPolicyVersionInput {
  version: string;
  contentHash: string;
  /** At least one of `contentText` / `archiveUrl` is required by the backend. */
  contentText?: string;
  archiveUrl?: string;
}

/** What `/api/admin/policy-text` returns: the storefront page as plain text. */
export interface StorefrontPolicyText {
  text: string;
  chars: number;
  sourceUrl: string;
}
