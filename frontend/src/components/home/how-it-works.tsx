"use client";

import { CalendarCheck, MapPin, Sparkles, type LucideIcon } from "lucide-react";

type Step = { num: string; icon: LucideIcon; title: string; description: string; color: string };

const STEPS: Step[] = [
  { num: "01", icon: MapPin,        title: "Find",  description: "Search by location or category. See real-time availability.", color: "from-blue-500 to-primary" },
  { num: "02", icon: CalendarCheck,  title: "Book",  description: "Pick a slot. Confirm in seconds with secure payment.",       color: "from-primary to-accent" },
  { num: "03", icon: Sparkles,       title: "Enjoy", description: "Show up, play, repeat. Leave a review to help others.",      color: "from-accent to-pink-500" },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
      {/* Soft background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white" />
      <div className="absolute inset-0 dot-pattern opacity-30" />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Three steps. Zero friction.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="relative rounded-2xl border bg-white p-8 text-center card-lift group">
                {/* Step number watermark */}
                <span className="absolute top-3 right-4 text-6xl font-black text-muted/40 select-none">
                  {s.num}
                </span>

                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color}
                                text-white shadow-lg mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.description}</p>

                {/* Connector line (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-primary/20" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
