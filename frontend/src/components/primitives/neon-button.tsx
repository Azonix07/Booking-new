"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export interface NeonButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-6 text-sm rounded-xl",
  lg: "h-13 px-8 text-base rounded-2xl",
};

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        whileHover={isDisabled ? undefined : { y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-medium",
          "transition-[box-shadow,background,color] duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(230_35%_4%)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizes[size],
          variant === "primary" && [
            "text-white",
            "bg-[linear-gradient(135deg,hsl(268_94%_60%)_0%,hsl(220_94%_58%)_55%,hsl(188_94%_52%)_100%)]",
            "shadow-[0_0_0_1px_hsl(268_94%_66%/0.45),0_10px_30px_-8px_hsl(268_94%_60%/0.6),inset_0_1px_0_rgb(255_255_255/0.18)]",
            "hover:shadow-[0_0_0_1px_hsl(268_94%_66%/0.6),0_14px_40px_-8px_hsl(268_94%_60%/0.75),inset_0_1px_0_rgb(255_255_255/0.22)]",
          ],
          variant === "outline" && [
            "text-foreground bg-white/[0.02] backdrop-blur",
            "ring-1 ring-inset ring-white/10",
            "hover:bg-white/[0.05] hover:ring-white/20",
          ],
          variant === "ghost" && [
            "text-foreground/85 hover:text-foreground",
            "hover:bg-white/[0.05]",
          ],
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
        {variant === "primary" && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.25), transparent 60%)",
            }}
          />
        )}
      </motion.button>
    );
  },
);

NeonButton.displayName = "NeonButton";
