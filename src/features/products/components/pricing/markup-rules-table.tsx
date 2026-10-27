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
import { MarkupRulesTableSkeleton } from "../products-skeletons";
import type { MarkupRule } from "../../types/pricing";
import { ruleScopeLabel } from "./markup-rule-utils";

const HEAD =
  "font-semibold text-xs text-muted-foreground";

const APPLY_TO_LABEL: Record<string, string> = {
  PRICE: "Selling price",
};

interface MarkupRulesTableProps {
  rules: MarkupRule[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (rule: MarkupRule) => void;
  onApply: (rule: MarkupRule) => void;
  onResetKeepActive: (rule: MarkupRule) => void;
  onCancel: (rule: MarkupRule) => void;
  onDelete: (rule: MarkupRule) => void;
}

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
  if (isLoading) return <MarkupRulesTableSkeleton />;

  return (
    <div className="w-full overflow-x-auto">
      {/* table-fixed: under the default auto layout a column sizes to its
          content, so one long product-scoped rule name widens the Scope column
          and scrolls the whole table sideways. Fixed layout gives every column
          a definite width, which is also what lets the cell's `truncate` clip. */}
      <Table className="min-w-[760px] table-fixed">
        <TableHeader className="bg-primary/[0.04]">
          <TableRow className="border-b-border/60">
            <TableHead className={`${HEAD} w-[28%]`}>Scope</TableHead>
            <TableHead className={`${HEAD} w-[14%]`}>Markup</TableHead>
            <TableHead className={`${HEAD} w-[13%]`}>Applies to</TableHead>
            <TableHead className={`${HEAD} w-[18%]`}>Status</TableHead>
            <TableHead className={`${HEAD} w-[17%]`}>Created By</TableHead>
            <TableHead className={`${HEAD} w-[10%] text-right pr-6`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <StateRow>
              <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
                <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive-ink">
                  <AppIcon icon="solar:danger-circle-linear" className="size-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Couldn’t load markup rules
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This needs the products:write permission. Try again shortly.
                  </p>
                </div>
                <Button variant="outline" onClick={onRetry} className="mt-1">
                  Retry
                </Button>
              </div>
            </StateRow>
          ) : rules.length === 0 ? (
            <StateRow compact>
              <AppIcon
                icon="solar:sale-linear"
                className="size-8 opacity-30 mx-auto mb-2"
              />
              <span className="text-xs font-medium text-muted-foreground">
                No markup rules yet
              </span>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground/80">
                Running sales are not listed here — they live under Deals.
              </p>
            </StateRow>
          ) : (
            rules.map((rule) => (
              <MarkupRuleRow
                key={rule.id}
                rule={rule}
                onEdit={onEdit}
                onApply={onApply}
                onResetKeepActive={onResetKeepActive}
                onCancel={onCancel}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function MarkupRuleRow({
  rule,
  onEdit,
  onApply,
  onResetKeepActive,
  onCancel,
  onDelete,
}: {
  rule: MarkupRule;
  onEdit: (rule: MarkupRule) => void;
  onApply: (rule: MarkupRule) => void;
  onResetKeepActive: (rule: MarkupRule) => void;
  onCancel: (rule: MarkupRule) => void;
  onDelete: (rule: MarkupRule) => void;
}) {
  const createdBy = rule.createdBy
    ? `${rule.createdBy.firstName} ${rule.createdBy.lastName}`.trim()
    : "—";

  return (
    <TableRow className="hover:bg-muted/30 border-b-border/40">
      <TableCell>
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className="block truncate font-semibold text-sm text-foreground leading-tight"
            title={ruleScopeLabel(rule)}
          >
            {ruleScopeLabel(rule)}
          </span>
          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium w-fit">
            {rule.ruleId}
          </span>
          {rule.notes && (
            <span className="truncate text-xs text-muted-foreground">
              {rule.notes}
            </span>
          )}
        </div>
      </TableCell>

      {/* Markups only — the list is filtered to MARKUP, so there is no sign to
          test and no discount styling to carry. */}
      <TableCell className="font-mono font-semibold text-sm tabular-nums text-foreground">
        +{rule.markupPercentage}%
      </TableCell>

      <TableCell>
        <Badge variant="muted" className="text-xs rounded-md py-0.5">
          {APPLY_TO_LABEL[rule.applyTo] ?? rule.applyTo}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge
          variant={rule.isActive ? "success" : "muted"}
          className="font-semibold text-xs px-2.5 py-1 rounded-full"
        >
          {rule.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      <TableCell className="text-muted-foreground text-xs font-medium">
        <span className="block truncate" title={createdBy}>
          {createdBy}
        </span>
      </TableCell>

      <TableCell className="text-right pr-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border"
            >
              <AppIcon icon="solar:menu-dots-bold" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onApply(rule)}>
              <AppIcon icon="solar:tag-price-linear" className="size-4 mr-2" />
              Preview &amp; Apply
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(rule)}>
              <AppIcon icon="solar:pen-2-linear" className="size-4 mr-2" />
              Edit Rule
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetKeepActive(rule)}>
              <AppIcon icon="solar:rewind-back-linear" className="size-4 mr-2" />
              Reset prices (keep active)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCancel(rule)}>
              <AppIcon icon="solar:undo-left-round-linear" className="size-4 mr-2" />
              Cancel rule &amp; reset to base
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
              className="text-destructive-ink focus:text-destructive-ink focus:bg-destructive/10 font-medium"
            >
              <AppIcon icon="solar:trash-bin-trash-linear" className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function StateRow({
  children,
  compact,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={6}
        className={compact ? "h-40 text-center" : "h-[360px]"}
      >
        {children}
      </TableCell>
    </TableRow>
  );
}
