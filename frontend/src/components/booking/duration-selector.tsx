"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Minus, Plus, Users } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Service, DurationOption } from "@/lib/types";

interface DurationSelectorProps {
  service: Service;
  selectedDuration: DurationOption | null;
  numberOfPersons: number;
  onDurationChange: (opt: DurationOption) => void;
  onPersonsChange: (n: number) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export function DurationSelector({
  service,
  selectedDuration,
  numberOfPersons,
  onDurationChange,
  onPersonsChange,
}: DurationSelectorProps) {
  const options = service.durationOptions?.length
    ? service.durationOptions
    : [{ minutes: service.defaultDuration, label: `${service.defaultDuration} min`, price: service.price }];

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={container}
    >
      <motion.div variants={item} className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-white text-sm font-bold">
          2
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Duration & Players</h2>
          <p className="text-xs text-muted-foreground">How long and how many?</p>
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-2xl border bg-white p-6 space-y-6"
      >
        {/* Duration chips */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
            <Clock className="h-3.5 w-3.5" /> Session Length
          </label>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isActive = selectedDuration?.minutes === opt.minutes;
              return (
                <motion.button
                  key={opt.minutes}
                  type="button"
                  onClick={() => onDurationChange(opt)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "relative rounded-xl px-5 py-3 text-sm font-medium transition-all duration-300 overflow-hidden",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted/30 text-foreground hover:bg-muted/60 border",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="duration-pill"
                      className="absolute inset-0 bg-primary rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="font-bold">{opt.label}</span>
                    <span className={cn(
                      "text-xs",
                      isActive ? "text-white/90" : "text-muted-foreground",
                    )}>
                      {formatCurrency(opt.price)}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Player count */}
        {service.maxPersons > 1 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
              <Users className="h-3.5 w-3.5" /> Number of Players
            </label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl border bg-gray-100 hover:bg-muted/60"
                onClick={() => onPersonsChange(Math.max(service.minPersons || 1, numberOfPersons - 1))}
                disabled={numberOfPersons <= (service.minPersons || 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={numberOfPersons}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-3xl font-bold tabular-nums w-10 text-center text-foreground"
                  >
                    {numberOfPersons}
                  </motion.span>
                </AnimatePresence>

                {/* Player dots */}
                <div className="flex gap-1">
                  {Array.from({ length: service.maxPersons }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        scale: i < numberOfPersons ? 1.2 : 0.8,
                        backgroundColor: i < numberOfPersons
                          ? "hsl(245, 58%, 51%)"
                          : "hsl(var(--muted))",
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="h-3 w-3 rounded-full"
                    />
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl border bg-gray-100 hover:bg-muted/60"
                onClick={() => onPersonsChange(Math.min(service.maxPersons, numberOfPersons + 1))}
                disabled={numberOfPersons >= service.maxPersons}
              >
                <Plus className="h-4 w-4" />
              </Button>

              <span className="text-xs text-muted-foreground">
                / {service.maxPersons} max
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.section>
  );
}
