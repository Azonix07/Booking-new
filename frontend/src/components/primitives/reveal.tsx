"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";

export function Reveal({
  children,
  delay = 0,
  y = 16,
  once = true,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number; once?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-10%" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  gap = 0.06,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { gap?: number; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10%" }}
      variants={stagger(gap, delay)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={fadeUp} {...props}>
      {children}
    </motion.div>
  );
}
