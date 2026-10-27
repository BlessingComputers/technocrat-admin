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

/** A recipient flattened for display. */
export interface RecipientRow {
  id: string;
  email: string;
  label: string | null;
  isActive: boolean;
  addedByName: string;
}

const HEAD = "font-medium text-xs text-muted-foreground";

interface RecipientsTableProps {
  rows: RecipientRow[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  /** Disables the row menu while a pause/resume is in flight. */
  isTogglingId?: string | null;
}

export function RecipientsTable({
  rows,
  isLoading,
  isError,
  onRetry,
  onCreate,
  onEdit,
  onToggleActive,
  onDelete,
  isTogglingId = null,
}: RecipientsTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader className="bg-primary/[0.04]">
          <TableRow className="border-b-border/60">
            <TableHead className={HEAD}>Recipient</TableHead>
            <TableHead className={HEAD}>Status</TableHead>
            <TableHead className={HEAD}>Added By</TableHead>
            <TableHead className={`${HEAD} text-right pr-6`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : isError ? (
            <StateRow>
              <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
                  <AppIcon
                    icon="solar:danger-circle-linear"
                    className="size-8"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Couldn’t load recipients
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This needs the salesNotifications:manage permission. Try
                    again shortly.
                  </p>
                </div>
                <Button variant="outline" onClick={onRetry} className="mt-1">
                  Retry
                </Button>
              </div>
            </StateRow>
          ) : rows.length === 0 ? (
            <StateRow>
              <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <AppIcon icon="solar:letter-linear" className="size-7" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    No recipients yet
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nobody is told when a sale completes. Add an address and the
                    next paid order sends an email.
                  </p>
                </div>
                <Button
                  onClick={onCreate}
                  className="mt-1 rounded-lg bg-primary font-medium text-primary-foreground"
                >
                  <AppIcon
                    icon="solar:add-circle-linear"
                    className="mr-2 size-4"
                  />
                  Add Recipient
                </Button>
              </div>
            </StateRow>
          ) : (
            rows.map((row) => (
              <RecipientTableRow
                key={row.id}
                row={row}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
                isToggling={isTogglingId === row.id}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function RecipientTableRow({
  row,
  onEdit,
  onToggleActive,
  onDelete,
  isToggling,
}: {
  row: RecipientRow;
  onEdit: (id: string) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
}) {
  return (
    <TableRow className="border-b-border/40 hover:bg-muted/30">
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold leading-tight text-foreground">
            {row.email}
          </span>
          {row.label && (
            <span className="max-w-[280px] truncate text-xs text-muted-foreground">
              {row.label}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <Badge
          variant={row.isActive ? "success" : "muted"}
          className="rounded-full px-2.5 py-1 text-xs font-medium"
        >
          {row.isActive ? "Active" : "Paused"}
        </Badge>
      </TableCell>

      <TableCell className="text-xs font-semibold text-muted-foreground">
        {row.addedByName}
      </TableCell>

      <TableCell className="pr-6 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isToggling}
              className="h-8 w-8 rounded-md border border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            >
              <AppIcon icon="solar:menu-dots-bold" className="h-4 w-4" />
              <span className="sr-only">Recipient actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(row.id)}>
              <AppIcon icon="solar:pen-2-linear" className="mr-2 size-4" />
              Edit Recipient
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleActive(row.id)}>
              <AppIcon
                icon={
                  row.isActive ? "solar:pause-linear" : "solar:play-linear"
                }
                className="mr-2 size-4"
              />
              {row.isActive ? "Pause Emails" : "Resume Emails"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(row.id)}
              className="font-medium text-destructive-ink focus:bg-destructive/10 focus:text-destructive-ink"
            >
              <AppIcon
                icon="solar:trash-bin-trash-linear"
                className="mr-2 size-4"
              />
              Remove
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
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i} className="border-b-border/40">
          <TableCell>
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted/70" />
            </div>
          </TableCell>
          <TableCell>
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          </TableCell>
          <TableCell>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </TableCell>
          <TableCell className="pr-6 text-right">
            <div className="ml-auto h-8 w-8 animate-pulse rounded-md bg-muted" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function StateRow({ children }: { children: React.ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={4} className="h-[280px]">
        {children}
      </TableCell>
    </TableRow>
  );
}
