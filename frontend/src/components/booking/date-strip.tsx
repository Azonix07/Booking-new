"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateStripProps {
  selected: string;
  onSelect: (date: string) => void;
}

export function DateStrip({ selected, onSelect }: DateStripProps) {
  const dates: { key: string; dayName: string; dayNum: number; monthShort: string; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push({
      key: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      monthShort: d.toLocaleDateString("en-US", { month: "short" }),
      isToday: i === 0,
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold">
          3
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Pick a Date</h2>
          <p className="text-xs text-muted-foreground">Select when you want to play</p>
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {dates.map((d, i) => {
          const isActive = selected === d.key;
          return (
            <motion.button
              key={d.key}
              type="button"
              onClick={() => onSelect(d.key)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex flex-col items-center min-w-[72px] rounded-2xl px-4 py-3 text-center transition-all duration-300 overflow-hidden",
                isActive
                  ? "text-white shadow-md"
                  : "bg-white border border-border hover:border-primary/30 hover:bg-primary/5",
              )}
            >
              {/* Active gradient background */}
              {isActive && (
                <motion.div
                  layoutId="date-bg"
                  className="absolute inset-0 bg-primary rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <span className={cn(
                "relative z-10 text-[10px] font-semibold uppercase tracking-wider",
                isActive ? "text-white/80" : "text-muted-foreground",
              )}>
                {d.isToday ? "Today" : d.dayName}
              </span>
              <span className="relative z-10 text-xl font-bold leading-tight mt-0.5">{d.dayNum}</span>
              <span className={cn(
                "relative z-10 text-[10px] mt-0.5",
                isActive ? "text-white/70" : "text-muted-foreground",
              )}>
                {d.monthShort}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
