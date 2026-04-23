"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "default" | "violet" | "cyan" | "magenta";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  tone?: Tone;
  interactive?: boolean;
  glow?: boolean;
}

const toneRing: Record<Tone, string> = {
  default: "before:bg-gradient-to-br before:from-white/12 before:via-white/3 before:to-transparent",
  violet:  "before:bg-gradient-to-br before:from-violet-400/40 before:via-violet-400/5 before:to-transparent",
  cyan:    "before:bg-gradient-to-br before:from-cyan-400/40 before:via-cyan-400/5 before:to-transparent",
  magenta: "before:bg-gradient-to-br before:from-pink-400/40 before:via-pink-400/5 before:to-transparent",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, tone = "default", interactive = false, glow = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -3 } : undefined}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={cn(
          "relative rounded-[22px] overflow-hidden",
          "bg-[hsl(232_30%_9%/0.55)] backdrop-blur-xl",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_8px_32px_-12px_rgb(0_0_0/0.6)]",
          "before:absolute before:inset-0 before:rounded-[inherit] before:p-px before:pointer-events-none",
          "before:[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]",
          "before:[mask-composite:exclude]",
          toneRing[tone],
          glow && "shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_60px_-12px_hsl(268_94%_66%/0.35)]",
          interactive && "cursor-pointer transition-shadow hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_20px_60px_-16px_rgb(0_0_0/0.75),0_0_40px_-8px_hsl(268_94%_66%/0.35)]",
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

GlassCard.displayName = "GlassCard";
