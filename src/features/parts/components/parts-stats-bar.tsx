import { Stat, StatsBar, type StatTone } from "@/components/shared/stats-bar";

interface PartsStatsBarProps {
  total: number;
  inStock: number;
  outOfStock: number;
  partTypes: number;
  isLoading?: boolean;
}

const CARDS: {
  key: keyof Omit<PartsStatsBarProps, "isLoading">;
  title: string;
  icon: string;
  tone: StatTone;
}[] = [
  {
    key: "total",
    title: "Total parts",
    icon: "solar:cpu-bolt-linear",
    tone: "primary",
  },
  {
    key: "inStock",
    title: "In stock",
    icon: "solar:check-circle-linear",
    tone: "success",
  },
  {
    key: "outOfStock",
    title: "Out of stock",
    icon: "solar:close-circle-linear",
    tone: "danger",
  },
  {
    key: "partTypes",
    title: "Part types",
    icon: "solar:widget-5-linear",
    tone: "warning",
  },
];

export function PartsStatsBar({
  total,
  inStock,
  outOfStock,
  partTypes,
  isLoading,
}: PartsStatsBarProps) {
  const values = { total, inStock, outOfStock, partTypes };
  return (
    <StatsBar>
      {CARDS.map((card) => (
        <Stat
          key={card.key}
          icon={card.icon}
          tone={card.tone}
          label={card.title}
          value={
            isLoading ? (
              <span className="mt-1 block h-8 w-12 animate-pulse rounded bg-muted" />
            ) : (
              values[card.key]
            )
          }
        />
      ))}
    </StatsBar>
  );
}
