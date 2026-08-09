import { AppIcon } from "@/components/shared/app-icon";
import { Card } from "@/components/ui/card";
import type { MonitorErrorDetail } from "../../types/monitor";

export function RequestErrorCard({ error }: { error: MonitorErrorDetail }) {
  if (!error) return null;

  return (
    <Card className="p-6 border border-destructive/25 bg-destructive/5 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-destructive flex items-center gap-2">
        <AppIcon icon="solar:danger-circle-linear" className="w-4 h-4" />
        {error.type}
      </h3>
      <p className="text-sm text-destructive/90 font-medium">{error.message}</p>
      {error.code && (
        <p className="text-xs text-destructive/70 font-mono">{error.code}</p>
      )}
      {error.stack && (
        <pre className="text-xs font-mono text-destructive/80 bg-destructive/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
          {error.stack}
        </pre>
      )}
    </Card>
  );
}
