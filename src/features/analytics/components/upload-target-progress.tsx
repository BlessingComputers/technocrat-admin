import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface UploadTargetProgressProps {
  today: number;
  target: number;
  percent: number;
  isCustom: boolean;
}

/** Today's uploads as a progress bar against the staff member's daily target. */
export function UploadTargetProgress({
  today,
  target,
  percent,
  isCustom,
}: UploadTargetProgressProps) {
  const met = percent >= 100;

  return (
    <div className="w-40 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tabular-nums">
          {today}
          <span className="font-medium text-muted-foreground"> / {target}</span>
        </span>
        <Badge
          variant={met ? "success" : "warning"}
          className="h-4 rounded-md px-1.5 text-xs font-semibold"
        >
          {Math.round(percent)}%
        </Badge>
      </div>
      <Progress value={Math.min(percent, 100)} className="h-1.5" />
      {isCustom && (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Custom target
        </span>
      )}
    </div>
  );
}
