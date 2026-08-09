import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UploaderRow } from "./uploader-row";
import type { UploaderSummary } from "../types/upload-analytics";

const HEAD = "text-xs font-semibold text-muted-foreground";

interface UploadersTableProps {
  uploaders: UploaderSummary[];
  /** When provided, each row shows a target-management action. */
  onEdit?: (uploader: UploaderSummary) => void;
}

/** Uploaders ranked by today's total (backend-sorted). */
export function UploadersTable({ uploaders, onEdit }: UploadersTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${HEAD} pl-6`}>Uploader</TableHead>
            <TableHead className={HEAD}>Today vs Target</TableHead>
            <TableHead className={`${HEAD} text-right`}>Products</TableHead>
            <TableHead className={`${HEAD} text-right`}>Parts</TableHead>
            <TableHead className={`${HEAD} text-right`}>Total</TableHead>
            <TableHead className={`${HEAD} pr-6 text-right`}>Daily Avg</TableHead>
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
