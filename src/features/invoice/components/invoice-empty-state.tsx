import { AppIcon } from "@/components/shared/app-icon";

interface InvoiceEmptyStateProps {
  message?: string;
}

/** "Nothing here yet!" placeholder (screen 3). */
export function InvoiceEmptyState({
  message = "Nothing here yet!",
}: InvoiceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted/50">
        <AppIcon
          icon="solar:document-text-linear"
          className="h-12 w-12 text-muted-foreground/40"
        />
      </div>
      <p className="mt-6 text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
