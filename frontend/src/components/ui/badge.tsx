import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants: Record<string, string> = {
    default:
      "bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/10",
    secondary:
      "bg-secondary text-secondary-foreground",
    destructive:
      "bg-destructive/10 text-destructive border border-destructive/10",
    outline: "text-foreground border",
    success:
      "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  };
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
