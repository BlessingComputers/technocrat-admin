import { Badge } from "@/components/ui/badge";
import { httpStatusTone } from "../utils/monitor-utils";

export function MonitorStatusBadge({ statusCode }: { statusCode: number }) {
  return (
    <Badge variant={httpStatusTone(statusCode)} className="tabular-nums">
      {statusCode}
    </Badge>
  );
}
