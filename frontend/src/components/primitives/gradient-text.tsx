import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function GradientText({
  className,
  from = "hsl(268 94% 70%)",
  via = "hsl(322 90% 65%)",
  to = "hsl(188 94% 60%)",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { from?: string; via?: string; to?: string }) {
  return (
    <span
      className={cn("bg-clip-text text-transparent animate-gradient", className)}
      style={{
        backgroundImage: `linear-gradient(110deg, ${from} 0%, ${via} 50%, ${to} 100%)`,
        backgroundSize: "200% 200%",
      }}
      {...props}
    >
      {children}
    </span>
  );
}
