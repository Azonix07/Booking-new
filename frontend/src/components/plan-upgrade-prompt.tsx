"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubscriptionPlan } from "@/lib/types";

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Free",
  standard: "Standard",
  ai: "AI",
  full_service: "Full-Service",
};

export function PlanUpgradePrompt({
  feature,
  description,
  requiredPlans,
}: {
  feature: string;
  description: string;
  requiredPlans: SubscriptionPlan[];
}) {
  const labels = requiredPlans.map((p) => PLAN_LABELS[p]).join(" or ");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Lock className="h-10 w-10 text-white" />
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
        <Sparkles className="h-3 w-3" />
        Plan required: {labels}
      </div>

      <h2 className="text-2xl font-bold tracking-tight">{feature}</h2>
      <p className="mt-2 text-muted-foreground max-w-md">{description}</p>

      <Link href="/list-your-business#plans" className="mt-6">
        <Button className="rounded-xl bg-primary border-0 text-white shadow-md hover:shadow-lg transition-all">
          Compare plans
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </motion.div>
  );
}
