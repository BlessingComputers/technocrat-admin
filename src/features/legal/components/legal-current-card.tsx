"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";

import type { PolicyVersion } from "../types/policy";

interface LegalCurrentCardProps {
  current: PolicyVersion | null;
  canPublish: boolean;
  onPublish: () => void;
}

function formatPublished(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * What customers are agreeing to right now, or the fact that nothing is.
 *
 * The empty state is the loud one on purpose. With no published version the
 * backend refuses every order with `POLICY_CONSENT_REQUIRED`, so "none yet" is
 * not a blank slate, it is checkout being down.
 */
export function LegalCurrentCard({
  current,
  canPublish,
  onPublish,
}: LegalCurrentCardProps) {
  if (!current) {
    return (
      <Card className="p-6 gap-0 border-destructive/30 bg-destructive/[0.04]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
              <AppIcon icon="solar:danger-triangle-bold" className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                No policy published
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Customers cannot place orders. Checkout asks every order to
                record the policy version the customer accepted, and there is
                nothing for it to record, so both bank transfer and card
                payments are refused.
              </p>
            </div>
          </div>
          {canPublish && (
            <Button onClick={onPublish}>Publish the policy</Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 gap-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {current.version}
            </h2>
            <Badge
              variant="success"
              className="rounded-full px-2.5 py-1 text-xs font-medium"
            >
              Live
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Published {formatPublished(current.publishedAt)}. Every order placed
            from now on records this version.
          </p>
        </div>
        {canPublish && (
          <Button variant="outline" onClick={onPublish}>
            Publish new version
          </Button>
        )}
      </div>

      <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Archived text
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {current.contentText
              ? `${current.contentText.length.toLocaleString()} characters`
              : "Not stored"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Content hash
          </dt>
          <dd
            className="mt-1 truncate font-mono text-sm text-foreground"
            title={current.contentHash}
          >
            {current.contentHash.slice(0, 16)}…
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Source page
          </dt>
          <dd className="mt-1 truncate text-sm">
            {current.archiveUrl ? (
              <a
                href={current.archiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-ink underline underline-offset-4"
              >
                View on the storefront
              </a>
            ) : (
              <span className="text-muted-foreground">Not recorded</span>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
