"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";

import type { PolicyVersion } from "../types/policy";

interface LegalHistoryTableProps {
  versions: PolicyVersion[] | undefined;
  isLoading: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

/**
 * Every version ever published, newest first.
 *
 * Superseded rows are the point of the screen, not filler: an order placed in
 * March points at March's text, and answering a dispute means reading the
 * version that order recorded, not today's.
 */
export function LegalHistoryTable({
  versions,
  isLoading,
}: LegalHistoryTableProps) {
  const [openVersion, setOpenVersion] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="p-6 gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card className="items-center justify-center gap-2 py-12 text-center">
        <AppIcon
          icon="solar:document-text-linear"
          className="size-7 text-muted-foreground"
        />
        <p className="text-sm font-medium text-foreground">
          Nothing published yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Published versions appear here, with the text as it read on the day.
        </p>
      </Card>
    );
  }

  const opened = versions.find((version) => version.version === openVersion);

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Archived text</TableHead>
            <TableHead className="text-right">Text</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((version) => (
            <TableRow key={version.version}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span className="font-medium text-foreground">
                    {version.version}
                  </span>
                  {version.isCurrent && (
                    <Badge
                      variant="success"
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                    >
                      Live
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(version.publishedAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {version.contentText
                  ? `${version.contentText.length.toLocaleString()} characters`
                  : "Link only"}
              </TableCell>
              <TableCell className="text-right">
                {version.contentText ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setOpenVersion(
                        openVersion === version.version
                          ? null
                          : version.version,
                      )
                    }
                  >
                    {openVersion === version.version ? "Hide" : "Read"}
                  </Button>
                ) : version.archiveUrl ? (
                  <a
                    href={version.archiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-ink underline underline-offset-4"
                  >
                    Open link
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {opened?.contentText && (
        <div className="border-t border-border bg-muted/20 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {opened.version}, as published
          </p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
            {opened.contentText}
          </pre>
        </div>
      )}
    </Card>
  );
}
