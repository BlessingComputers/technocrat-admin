import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { UploadTargetProgress } from "./upload-target-progress";
import type { UploaderSummary } from "../types/upload-analytics";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface UploaderRowProps {
  uploader: UploaderSummary;
  /** When provided, renders a target-management action for this row. */
  onEdit?: (uploader: UploaderSummary) => void;
}

/** One uploader's row: identity, today-vs-target, period totals, target action. */
export function UploaderRow({ uploader, onEdit }: UploaderRowProps) {
  const {
    staff,
    totals,
    todayStat,
    dailyTarget,
    targetIsCustom,
    percentOfDailyTarget,
    dailyAverage,
  } = uploader;

  return (
    <TableRow>
      <TableCell className="pl-6">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {staff.avatarUrl && (
              <AvatarImage src={staff.avatarUrl} alt={staff.name} />
            )}
            <AvatarFallback>{initials(staff.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              href={`/users/uploads/${staff.id}`}
              className="block truncate text-sm font-semibold hover:text-primary-ink hover:underline"
            >
              {staff.name}
            </Link>
            <p className="text-xs font-medium text-muted-foreground">
              {staff.staffId}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <UploadTargetProgress
          today={todayStat.total}
          target={dailyTarget}
          percent={percentOfDailyTarget}
          isCustom={targetIsCustom}
        />
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums">
        {totals.products}
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums">
        {totals.parts}
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums">
        {totals.total}
      </TableCell>
      <TableCell className="pr-6 text-right font-medium tabular-nums text-muted-foreground">
        {dailyAverage.toFixed(1)}
      </TableCell>
      {onEdit && (
        <TableCell className="pr-6 text-right">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(uploader)}
            title="Set daily target"
          >
            <AppIcon icon="solar:target-linear" className="size-4" />
            <span className="sr-only">Set daily target</span>
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}
