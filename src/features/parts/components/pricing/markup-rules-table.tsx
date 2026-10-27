"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { PartsMarkupTableSkeleton } from "../parts-skeletons";
import type { PartMarkupRule } from "../../types/pricing";
import { APPLY_TO_LABEL, ruleScopeLabel } from "./markup-rule-utils";

interface MarkupRulesTableProps {
  rules: PartMarkupRule[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (rule: PartMarkupRule) => void;
  onApply: (rule: PartMarkupRule) => void;
  onResetKeepActive: (rule: PartMarkupRule) => void;
  onCancel: (rule: PartMarkupRule) => void;
  onDelete: (rule: PartMarkupRule) => void;
}

const HEAD =
  "font-semibold text-xs text-muted-foreground";

export function MarkupRulesTable({
  rules,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onApply,
  onResetKeepActive,
  onCancel,
  onDelete,
}: MarkupRulesTableProps) {
  if (isLoading) return <PartsMarkupTableSkeleton />;

  return (
    <div className="w-full overflow-x-auto">
      {/* table-fixed: under the default auto layout a column sizes to its
          content, so one long part-scoped rule name widens the Scope column and
          scrolls the whole table sideways. Fixed layout gives every column a
          definite width, which is also what lets the cell's `truncate` clip. */}
      <Table className="min-w-[720px] table-fixed">
        <TableHeader className="bg-primary/[0.04]">
          <TableRow className="border-b-border/60">
            <TableHead className={cn(HEAD, "w-[32%]")}>Scope</TableHead>
            <TableHead className={cn(HEAD, "w-[16%]")}>Markup</TableHead>
            <TableHead className={cn(HEAD, "w-[15%]")}>Applies to</TableHead>
            <TableHead className={cn(HEAD, "w-[23%]")}>Status</TableHead>
            <TableHead className={cn(HEAD, "w-[14%] pr-6 text-right")}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={5} className="h-60 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  Couldn&apos;t load markup rules.
                </p>
                <Button variant="outline" onClick={onRetry}>
                  Retry
                </Button>
              </TableCell>
            </TableRow>
          ) : rules.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-40 text-center text-muted-foreground"
              >
                <AppIcon
                  icon="solar:tag-price-linear"
                  className="mx-auto mb-2 size-8 opacity-30"
                />
                <span className="text-xs font-medium">
                  No markup rules yet
                </span>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground/80">
                  Running sales are not listed here — they live under Deals.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule.id} className="border-b-border/40 hover:bg-muted/30">
                <TableCell>
                  <div className="min-w-0">
                    <span
                      className="block truncate text-sm font-semibold text-foreground"
                      title={ruleScopeLabel(rule)}
                    >
                      {ruleScopeLabel(rule)}
                    </span>
                    {rule.notes && (
                      <p className="truncate text-xs italic text-muted-foreground">
                        {rule.notes}
                      </p>
                    )}
                  </div>
                </TableCell>
                {/* Markups only — the list is filtered to MARKUP, so there is
                    no sign to test and no discount styling to carry. */}
                <TableCell className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  +{rule.markupPercentage}%
                </TableCell>
                <TableCell>
                  <Badge variant="muted" className="text-xs">
                    {APPLY_TO_LABEL[rule.applyTo] ?? rule.applyTo}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={rule.isActive ? "success" : "muted"}
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  >
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md border border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                      >
                        <AppIcon icon="solar:menu-dots-bold" className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onApply(rule)}>
                        <AppIcon icon="solar:magic-stick-3-linear" className="mr-2 size-4" />
                        Preview &amp; apply
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(rule)}>
                        <AppIcon icon="solar:pen-2-linear" className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onResetKeepActive(rule)}>
                        <AppIcon icon="solar:rewind-back-linear" className="mr-2 size-4" />
                        Reset prices
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCancel(rule)}>
                        <AppIcon icon="solar:forbidden-circle-linear" className="mr-2 size-4" />
                        Cancel &amp; reset
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(rule)}
                        disabled={rule.isActive}
                        title={
                          rule.isActive
                            ? "Cancel the rule first — an active rule cannot be deleted"
                            : undefined
                        }
                        className="font-medium text-destructive-ink focus:bg-destructive/10 focus:text-destructive-ink"
                      >
                        <AppIcon icon="solar:trash-bin-trash-linear" className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
