import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UploaderRow, PERIOD_START } from "./uploader-row";
import { describeRange, type DateRange } from "../model/upload-period";
import type { UploaderSummary } from "../types/upload-analytics";

const HEAD = "text-xs font-semibold text-muted-foreground";
const GROUP = "h-8 text-xs font-semibold text-foreground";

interface UploadersTableProps {
  uploaders: UploaderSummary[];
  /** The selected period, named over the period columns. */
  range: DateRange;
  /** When provided, each row shows a target-management action. */
  onEdit?: (uploader: UploaderSummary) => void;
}

/**
 * Uploaders with two column groups: "Today" (always today, whatever the
 * period) and the selected period's totals, so the two never read as one.
 */
export function UploadersTable({ uploaders, range, onEdit }: UploadersTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="pl-6" />
            <TableHead className={GROUP}>Today</TableHead>
            <TableHead colSpan={5} className={`${GROUP} ${PERIOD_START} pr-6`}>
              Selected period
              <span className="ml-2 font-medium tabular-nums text-muted-foreground">
                {describeRange(range)}
              </span>
            </TableHead>
            {onEdit && <TableHead />}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${HEAD} pl-6`}>Uploader</TableHead>
            <TableHead className={HEAD}>Progress vs daily target</TableHead>
            <TableHead className={`${HEAD} ${PERIOD_START} text-right`}>Products</TableHead>
            <TableHead className={`${HEAD} text-right`}>Parts</TableHead>
            <TableHead className={`${HEAD} text-right`}>Updates</TableHead>
            <TableHead className={`${HEAD} text-right`}>Total</TableHead>
            <TableHead className={`${HEAD} pr-6 text-right`}>Daily avg</TableHead>
            {onEdit && (
              <TableHead className={`${HEAD} pr-6 text-right`}>
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {uploaders.map((uploader) => (
            <UploaderRow
              key={uploader.staff.id}
              uploader={uploader}
              onEdit={onEdit}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
