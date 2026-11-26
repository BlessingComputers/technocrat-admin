"use client";

import Link from "next/link";

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
import { formatPrice } from "@/lib/utils/format";

import {
  formatAdjustment,
  formatRewardMonth,
  isOpenForAction,
  paidOnLabel,
  staffName,
  uploadsOf,
} from "../model/reward-rules";
import type { RewardRow } from "../types/rewards";

interface RewardStatementsTableProps {
  rows: RewardRow[];
  canAdjust: boolean;
  canPay: boolean;
  /**
   * "uploader": one month, one row per uploader (team page), names link to
   * each uploader's page. "month": one uploader, one row per month.
   */
  by?: "uploader" | "month";
  onAdjust: (row: RewardRow) => void;
  onPay: (row: RewardRow) => void;
}

export function RewardStatementsTable({
  rows,
  canAdjust,
  canPay,
  by = "uploader",
  onAdjust,
  onPay,
}: RewardStatementsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{by === "month" ? "Month" : "Uploader"}</TableHead>
          <TableHead className="text-right">Uploads</TableHead>
          <TableHead className="text-right">Updates</TableHead>
          <TableHead className="text-right">Computed</TableHead>
          <TableHead className="text-right">Adjustment</TableHead>
          <TableHead className="text-right">Final</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="sr-only">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const actionable = isOpenForAction(row);
          return (
            // Not keyed by id: open-month rows all have id null.
            <TableRow key={by === "month" ? row.month : row.staff.id}>
              <TableCell className="font-medium">
                {by === "month" ? (
                  formatRewardMonth(row.month)
                ) : (
                  <Link
                    href={`/rewards/team/${encodeURIComponent(row.staff.id)}`}
                    className="hover:underline"
                  >
                    {staffName(row)}
                  </Link>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{uploadsOf(row)}</TableCell>
              <TableCell className="text-right tabular-nums">{row.updates}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(row.computedAmount)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAdjustment(row.adjustment)}
                {row.adjustmentReason && (
                  <span className="block max-w-48 truncate text-xs text-muted-foreground" title={row.adjustmentReason}>
                    {row.adjustmentReason}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatPrice(row.finalAmount)}
              </TableCell>
              <TableCell>
                {row.id === null ? (
                  <Badge variant="info">Live</Badge>
                ) : row.paidAt ? (
                  <>
                    <Badge variant="success" title={row.paidNote ?? undefined}>
                      {paidOnLabel(row.paidAt)}
                    </Badge>
                    {row.paidBy && (
                      <span className="block text-xs text-muted-foreground">
                        by {row.paidBy.firstName} {row.paidBy.lastName}
                      </span>
                    )}
                  </>
                ) : (
                  <Badge variant="muted">Not paid yet</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {actionable && (
                  <div className="flex justify-end gap-1">
                    {canAdjust && (
                      <Button size="sm" variant="ghost" onClick={() => onAdjust(row)}>
                        Adjust
                      </Button>
                    )}
                    {canPay && (
                      <Button size="sm" variant="outline" onClick={() => onPay(row)}>
                        Mark paid
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
