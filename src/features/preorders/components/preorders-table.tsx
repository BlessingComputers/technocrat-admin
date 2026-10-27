import { AppIcon } from "@/components/shared/app-icon";
import { Card } from "@/components/ui/card";
import { PreorderTableRow } from "./preorder-table-row";
import { PreordersTableSkeleton } from "./preorders-skeletons";
import type { Preorder } from "../types/preorders";

interface PreordersTableProps {
  preorders: Preorder[];
  isLoading: boolean;
  /** Drives the empty state's wording — an unfiltered empty queue is good news. */
  isFiltered: boolean;
}

const TABLE_HEADERS = [
  "Customer",
  "Wants",
  "Reference",
  "Status",
  "Waiting",
  "Actions",
];

export function PreordersTable({
  preorders,
  isLoading,
  isFiltered,
}: PreordersTableProps) {
  if (isLoading) {
    return <PreordersTableSkeleton />;
  }

  if (preorders.length === 0) {
    return (
      <Card className="gap-0 py-20 text-center">
        <AppIcon
          icon={
            isFiltered
              ? "solar:magnifer-linear"
              : "solar:clipboard-check-linear"
          }
          className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
        />
        <h3 className="text-xl font-semibold text-foreground">
          {isFiltered ? "No pre-orders match" : "Nothing waiting"}
        </h3>
        <p className="text-muted-foreground font-medium">
          {isFiltered
            ? "Try a different status or search term."
            : "No customer has asked for stock we don't hold yet."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-x-auto w-full py-0">
      <table className="w-full text-left min-w-[1000px]">
        <thead>
          <tr className="border-b border-border bg-primary/[0.04]">
            {TABLE_HEADERS.map((header) => (
              <th
                key={header}
                className={`px-8 py-5 text-xs font-medium text-muted-foreground${header === "Actions" ? " text-right" : ""}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {preorders.map((preorder) => (
            <PreorderTableRow key={preorder.id} preorder={preorder} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
