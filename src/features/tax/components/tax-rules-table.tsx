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

/** A rule flattened for display — kind-agnostic so one table serves both. */
export interface TaxRuleRow {
  id: string;
  ruleId: string;
  scopeLabel: string;
  rate: number;
  isActive: boolean;
  notes: string | null;
  createdByName: string;
}

const HEAD =
  "font-medium text-xs text-muted-foreground";

interface TaxRulesTableProps {
  rows: TaxRuleRow[];
  kind: "product" | "part";
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaxRulesTable({
  rows,
  kind,
  isLoading,
  isError,
  onRetry,
  onCreate,
  onEdit,
  onDelete,
}: TaxRulesTableProps) {
  const noun = kind === "part" ? "part" : "product";

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader className="bg-primary/[0.04]">
          <TableRow className="border-b-border/60">
            <TableHead className={HEAD}>Rule</TableHead>
            <TableHead className={`${HEAD} text-right`}>Rate</TableHead>
            <TableHead className={HEAD}>Status</TableHead>
            <TableHead className={HEAD}>Created By</TableHead>
            <TableHead className={`${HEAD} text-right pr-6`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : isError ? (
            <StateRow>
              <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
                <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive-ink">
                  <AppIcon icon="solar:danger-circle-linear" className="size-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Couldn’t load {noun} tax rules
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This needs the tax:manage permission. Try again shortly.
                  </p>
                </div>
                <Button variant="outline" onClick={onRetry} className="mt-1">
                  Retry
                </Button>
              </div>
            </StateRow>
          ) : rows.length === 0 ? (
            <StateRow>
              <div className="flex flex-col items-center justify-center gap-3 text-center max-w-sm mx-auto">
                <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <AppIcon icon="solar:bill-list-linear" className="size-7" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    No {noun} tax rules yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Every {noun} uses the store rate. Add a rule to charge a
                    different rate for a category, brand{kind === "part" ? ", or part type" : ""}.
                  </p>
                </div>
                <Button
                  onClick={onCreate}
                  className="mt-1 rounded-lg bg-primary text-primary-foreground font-medium"
                >
                  <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
                  New Rule
                </Button>
              </div>
            </StateRow>
          ) : (
            rows.map((row) => (
              <TaxRuleTableRow
                key={row.id}
                row={row}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TaxRuleTableRow({
  row,
  onEdit,
  onDelete,
}: {
  row: TaxRuleRow;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <TableRow className="hover:bg-muted/30 border-b-border/40">
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm text-foreground leading-tight">
            {row.scopeLabel}
          </span>
          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold w-fit">
            {row.ruleId}
          </span>
          {row.notes && (
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
              {row.notes}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right font-mono font-semibold text-sm tabular-nums text-foreground">
        {+row.rate.toFixed(2)}%
      </TableCell>

      <TableCell>
        <Badge
          variant={row.isActive ? "success" : "muted"}
          className="font-medium text-xs px-2.5 py-1 rounded-full"
        >
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      <TableCell className="text-muted-foreground text-xs font-semibold">
        {row.createdByName}
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
              <span className="sr-only">Rule actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(row.id)}>
              <AppIcon icon="solar:pen-2-linear" className="size-4 mr-2" />
              Edit Rule
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(row.id)}
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

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i} className="border-b-border/40">
          <TableCell>
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted/70 animate-pulse" />
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="ml-auto h-4 w-12 rounded bg-muted animate-pulse" />
          </TableCell>
          <TableCell>
            <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          </TableCell>
          <TableCell>
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="ml-auto h-8 w-8 rounded-md bg-muted animate-pulse" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function StateRow({ children }: { children: React.ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={5} className="h-[320px]">
        {children}
      </TableCell>
    </TableRow>
  );
}
