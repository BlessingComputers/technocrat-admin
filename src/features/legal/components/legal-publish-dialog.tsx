"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";

import {
  usePublishPolicyVersion,
  useStorefrontPolicyText,
} from "../api/policy.queries";
import type { PolicyVersion } from "../types/policy";

interface LegalPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: PolicyVersion | null;
}

/** Today as `YYYY-MM-DD`, the label every version so far has used. */
function todayLabel(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * SHA-256, hex, of the exact string being archived.
 *
 * Computed here rather than server-side so that the hash covers the bytes this
 * dialog is sending, not a copy something else re-read later.
 */
async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Publish a new checkout policy version.
 *
 * The text is not typed here. It is read from the live storefront page, so the
 * archived copy is the words customers actually see — see
 * `/api/admin/policy-text`. Staff choose the label and confirm; the hash and the
 * archive URL follow from the fetch.
 */
export function LegalPublishDialog({
  open,
  onOpenChange,
  current,
}: LegalPublishDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle>Publish a policy version</DialogTitle>
        {/* Mounted only while open, so the label and any error seed fresh on
            each open rather than being reset by an effect. Leaving yesterday's
            date in the box is how you publish a version whose name lies about
            when it went live. */}
        {open && (
          <PublishForm
            current={current}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PublishFormProps {
  current: PolicyVersion | null;
  onDone: () => void;
  onCancel: () => void;
}

function PublishForm({ current, onDone, onCancel }: PublishFormProps) {
  const [version, setVersion] = useState(todayLabel);
  const [error, setError] = useState<string | null>(null);

  const storefront = useStorefrontPolicyText(true);
  const publish = usePublishPolicyVersion();

  const text = storefront.data?.text;
  const isDuplicate = version.trim() === current?.version;

  const handlePublish = async () => {
    const label = version.trim();
    if (!label) {
      setError("Give the version a label.");
      return;
    }
    if (isDuplicate) {
      setError(
        `"${label}" is already the current version. Version labels are unique, so this one needs a new name.`,
      );
      return;
    }
    if (!text) {
      setError("The policy text has not loaded yet.");
      return;
    }

    setError(null);
    const promise = publish
      .mutateAsync({
        version: label,
        contentHash: await sha256Hex(text),
        contentText: text,
        archiveUrl: storefront.data?.sourceUrl,
      })
      .then((published) => {
        onDone();
        return published;
      });

    toast.promise(promise, {
      loading: "Publishing policy version…",
      success: (published) => `${published.version} is now the live policy.`,
      error: (err) => getErrorMessage(err, "Failed to publish the policy."),
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="policy-version">Version label</Label>
        <Input
          id="policy-version"
          value={version}
          onChange={(event) => setVersion(event.target.value)}
          placeholder="2026-09-21"
        />
        <p className="text-xs text-muted-foreground">
          Customers see this as the effective date on the policy page, and every
          order records it. Labels are unique and cannot be reused.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label>Text to archive</Label>
          {storefront.data && (
            <span className="text-xs text-muted-foreground">
              {storefront.data.chars.toLocaleString()} characters from{" "}
              <span className="font-mono">{storefront.data.sourceUrl}</span>
            </span>
          )}
        </div>

        {storefront.isLoading && (
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            <AppIcon
              icon="solar:refresh-linear"
              className="size-4 animate-spin"
            />
            Reading the policy page from the storefront…
          </div>
        )}

        {storefront.isError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-4 py-3">
            <AppIcon
              icon="solar:danger-circle-bold"
              className="mt-0.5 size-4 shrink-0 text-destructive-ink"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/80">
                {getErrorMessage(
                  storefront.error,
                  "Could not read the policy from the storefront.",
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => storefront.refetch()}
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        {text && (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground">
            {text}
          </pre>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-info/30 bg-info/[0.06] px-4 py-3">
        <AppIcon
          icon="solar:info-circle-bold"
          className="mt-0.5 size-4 shrink-0 text-info-ink"
        />
        <p className="text-sm font-medium text-foreground/80">
          Publishing takes effect for the next order placed. The previous
          version stays on file, and orders already placed under it keep
          pointing at the text their customer agreed to.
        </p>
      </div>

      {error && <p className="text-sm text-destructive-ink">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handlePublish} disabled={!text || publish.isPending}>
          {publish.isPending ? "Publishing…" : "Publish version"}
        </Button>
      </div>
    </div>
  );
}
