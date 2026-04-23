"use client";

import { useMemo } from "react";

/** Compact SVG sparkline with gradient stroke + fill, no deps. */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  stroke = "hsl(268 94% 70%)",
  fillFrom = "hsl(268 94% 70% / 0.35)",
  fillTo = "hsl(268 94% 70% / 0)",
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fillFrom?: string;
  fillTo?: string;
  className?: string;
}) {
  const { path, area } = useMemo(() => {
    if (!data.length) return { path: "", area: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = data.length > 1 ? width / (data.length - 1) : width;
    const pts = data.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return [x, y] as const;
    });
    const d = pts
      .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
      .join(" ");
    const a = `${d} L${width},${height} L0,${height} Z`;
    return { path: d, area: a };
  }, [data, width, height]);

  const gradId = useMemo(() => `spark-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
