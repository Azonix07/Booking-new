"use client";

import { motion } from "framer-motion";
import { Check, Calendar, Gamepad2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  steps: { label: string; icon: React.ElementType }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const Icon = step.icon;

        return (
          <div key={stepNum} className="flex items-center gap-1 sm:gap-2">
            {/* Step circle */}
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
                backgroundColor: isCompleted
                  ? "hsl(var(--primary))"
                  : isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                isCompleted || isActive ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{stepNum}</span>
            </motion.div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className="relative h-0.5 w-6 sm:w-10 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
