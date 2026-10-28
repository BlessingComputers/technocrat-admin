/**
 * Turn a list of records into a downloaded CSV, Excel or PDF file.
 *
 * The Excel and PDF writers are imported on demand, so neither lands in the
 * page bundle until someone actually exports.
 */

export type ExportFormat = "csv" | "xlsx" | "pdf";

export type ExportValue = string | number | boolean | Date | null | undefined;

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => ExportValue;
  /** Excel column width in characters. */
  width?: number;
  /** Left out of the PDF, which has no room for every column. */
  pdf?: boolean;
}

export const EXPORT_FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "csv", label: "CSV" },
  { format: "xlsx", label: "Excel (.xlsx)" },
  { format: "pdf", label: "PDF" },
];

/** Dates render as YYYY-MM-DD in CSV and PDF; Excel keeps them as real dates. */
function toText(value: ExportValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function csvCell(value: ExportValue): string {
  const text = toText(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const lines = [
    columns.map((c) => csvCell(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(",")),
  ];
  // The BOM tells Excel the file is UTF-8, so names like "Adébáyọ̀" survive.
  return `﻿${lines.join("\r\n")}`;
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  // Revoking in the same tick can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function toXlsx<T>(rows: T[], columns: ExportColumn<T>[]): Promise<Blob> {
  const { default: writeExcelFile } = await import("write-excel-file/universal");
  const header = columns.map((c) => ({ value: c.header, fontWeight: "bold" as const }));
  const body = rows.map((row) =>
    columns.map((c) => {
      const value = c.value(row);
      if (value == null) return null;
      return value instanceof Date ? { value, format: "yyyy-mm-dd" } : value;
    }),
  );
  return writeExcelFile([header, ...body], {
    columns: columns.map((c) => ({ width: c.width ?? 16 })),
    stickyRowsCount: 1,
  }).toBlob();
}

async function toPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  title: string,
): Promise<Blob> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const cols = columns.filter((c) => c.pdf !== false);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(12);
  doc.text(`${title} · ${rows.length} rows · ${toText(new Date())}`, 40, 32);
  autoTable(doc, {
    startY: 44,
    head: [cols.map((c) => c.header)],
    body: rows.map((row) => cols.map((c) => toText(c.value(row)))),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [40, 40, 40] },
    margin: { left: 40, right: 40 },
  });
  return doc.output("blob");
}

/** Build the file in `format` and hand it to the browser's download flow. */
export async function exportRows<T>(
  format: ExportFormat,
  rows: T[],
  columns: ExportColumn<T>[],
  { fileName, title }: { fileName: string; title: string },
): Promise<void> {
  const blob =
    format === "csv"
      ? new Blob([toCsv(rows, columns)], { type: "text/csv;charset=utf-8" })
      : format === "xlsx"
        ? await toXlsx(rows, columns)
        : await toPdf(rows, columns, title);
  download(blob, `${fileName}.${format}`);
}
