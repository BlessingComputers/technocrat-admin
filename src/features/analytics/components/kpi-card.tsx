import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { AppIcon } from "@/components/shared/app-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendType: "up" | "down";
  description: string;
  icon: ReactNode;
  color: "primary" | "emerald" | "amber" | "blue";
}

const COLORS: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-success/15 text-success",
  amber: "bg-warning/15 text-warning",
  blue: "bg-info/10 text-info",
};

export function KpiCard({
  title,
  value,
  trend,
  trendType,
  description,
  icon,
  color,
}: KpiCardProps) {
  return (
    <Card className="hover:border-primary/20 transition-all group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "size-10 rounded-xl flex items-center justify-center",
              COLORS[color],
            )}
          >
            {icon}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <AppIcon icon="solar:menu-dots-bold" className="size-4" />
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">{value}</h3>
            <Badge
              variant={trendType === "up" ? "success" : "danger"}
              className="rounded-lg h-5 px-1.5 text-xs"
            >
              <AppIcon
                icon={
                  trendType === "up"
                    ? "solar:arrow-right-up-linear"
                    : "solar:arrow-right-down-linear"
                }
                className="size-2.5 mr-0.5"
              />
              {trend}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
