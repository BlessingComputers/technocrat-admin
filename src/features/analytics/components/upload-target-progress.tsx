import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MetaLabel } from "@/components/shared/meta-label";
import { workSplitLabel } from "../model/uploader-work";

interface UploadTargetProgressProps {
  today: number;
  target: number;
  percent: number;
  isCustom: boolean;
  /** Today's total split into new items and credited updates. */
  split?: { uploads: number; updates: number };
}

/** Today's work (uploads + updates) as a progress bar against the daily target. */
export function UploadTargetProgress({
  today,
  target,
  percent,
  isCustom,
  split,
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
      {split && (
        <p className="text-xs font-medium tabular-nums text-muted-foreground">
          {workSplitLabel(split.uploads, split.updates)}
        </p>
      )}
      {isCustom && (
        <MetaLabel>
          Custom target
        </MetaLabel>
      )}
    </div>
  );
}
