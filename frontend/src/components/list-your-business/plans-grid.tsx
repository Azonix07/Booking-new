"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/types";

interface Plan {
  key: SubscriptionPlan;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    price: "₹0",
    cadence: "forever",
    tagline: "A basic booking page to get started.",
    features: [
      "Booking page with your business profile",
      "Time-slot management",
      "Seating capacity handling",
      "Minimal admin dashboard",
      "Email booking confirmations",
    ],
    ctaLabel: "Start for free",
    ctaHref: "/list-your-business/signup?plan=free",
  },
  {
    key: "standard",
    name: "Standard",
    price: "₹1,500",
    cadence: "/month",
    tagline: "Everything in Free, plus your brand.",
    features: [
      "Customizable pages (About, Gallery)",
      "Theme selection",
      "Editable navigation & sections",
      "Full admin dashboard",
      "Priority support",
    ],
    ctaLabel: "Choose Standard",
    ctaHref: "/list-your-business/signup?plan=standard",
    highlighted: true,
  },
  {
    key: "ai",
    name: "AI",
    price: "₹2,500",
    cadence: "/month",
    tagline: "AI generates your website instantly.",
    features: [
      "AI-generated website from your inputs",
      "Drag-and-edit section editor",
      "Regenerate any section with AI",
      "Theme + layout presets",
      "Everything in Standard",
    ],
    ctaLabel: "Go with AI",
    ctaHref: "/list-your-business/signup?plan=ai",
  },
  {
    key: "full_service",
    name: "Full-Service",
    price: "Custom",
    cadence: "quote",
    tagline: "We build a fully custom site for you.",
    features: [
      "Fully custom design & build",
      "SEO-optimized, fast, mobile-first",
      "Your own domain, hosted independently",
      "Optional free listing on the platform",
      "Dedicated developer + project manager",
    ],
    ctaLabel: "Request a quote",
    ctaHref: "/list-your-business/full-service",
  },
];

export function PlansGrid() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      style={{ perspective: "1200px" }}
    >
      {PLANS.map((plan, i) => (
        <motion.div
          key={plan.key}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, delay: i * 0.08 }}
          whileHover={{ y: -6, rotateX: -2, rotateY: 2 }}
          style={{ transformStyle: "preserve-3d" }}
          className={`relative rounded-2xl border bg-card p-6 flex flex-col shadow-sm hover:shadow-xl transition-shadow will-change-transform ${
            plan.highlighted
              ? "border-primary ring-2 ring-primary/20"
              : "border-border/60"
          }`}
        >
          {plan.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary text-white shadow-sm">
              <Sparkles className="h-3 w-3" />
              Most popular
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground min-h-[2.5rem]">
              {plan.tagline}
            </p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight">
                {plan.price}
              </span>
              <span className="text-sm text-muted-foreground">
                {plan.cadence}
              </span>
            </div>
          </div>

          <ul className="mt-6 space-y-3 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>

          <motion.div className="mt-6" whileTap={{ scale: 0.97 }}>
            <Link href={plan.ctaHref}>
              <Button
                className={`w-full rounded-xl h-11 ${
                  plan.highlighted
                    ? "bg-primary border-0 text-white shadow-sm hover:shadow-md"
                    : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.ctaLabel}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
