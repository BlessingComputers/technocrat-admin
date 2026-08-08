import { AppIcon } from "@/components/shared/app-icon";

/** Empty / error state for the upload performance section. */
export function UploaderAnalyticsEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <AppIcon
        icon="solar:cloud-upload-linear"
        className="size-8 text-muted-foreground/40"
      />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
