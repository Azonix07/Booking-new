"use client";

import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  hue?: number;
  trend?: number;
  spark?: number[];
  animate?: boolean;
  className?: string;
}

export function KpiCard({
  label, value, prefix, suffix, icon: Icon, trend, className,
}: KpiCardProps) {
  const trendPositive = (trend ?? 0) >= 0;
  const TrendIcon = trendPositive ? TrendingUp : TrendingDown;

  return (
    <div className={cn("rounded-2xl border bg-white p-5 card-lift group", className)}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white shadow-sm shadow-primary/20 group-hover:shadow-md group-hover:shadow-primary/30 transition-shadow">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>

      <p className="text-2xl font-bold tracking-tight tabular-nums">
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
      </p>

      {trend != null && (
        <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium",
          trendPositive ? "text-emerald-600" : "text-red-500"
        )}>
          <TrendIcon className="h-3 w-3" />
          {Math.abs(trend)}%
          <span className="text-muted-foreground font-normal ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}
