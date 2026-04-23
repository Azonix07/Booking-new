"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Sparkles, TrendingUp, Users } from "lucide-react";

const BENEFITS = [
  { icon: Users,       title: "Reach more customers", description: "Get discovered by people searching near you.", color: "from-blue-500 to-sky-600" },
  { icon: TrendingUp,  title: "Grow revenue",         description: "Fewer no-shows, more confirmed bookings.",    color: "from-emerald-500 to-teal-600" },
  { icon: Sparkles,    title: "Launch in minutes",     description: "Pick a plan, add your hours, start booking.",  color: "from-amber-500 to-orange-600" },
];

export function ListYourBusinessCta() {
  return (
    <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-accent/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-5xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-primary/15 px-4 py-1.5 text-xs font-semibold text-primary mb-8 shadow-sm">
          <Building2 className="h-3.5 w-3.5" />
          For Business Owners
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
          Run a venue?{" "}
          <span className="text-gradient">List it.</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          From a simple free booking page to a fully custom website —
          pick the plan that fits where you are today.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/list-your-business">
            <Button size="lg">
              List Your Business
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/list-your-business#plans">
            <Button variant="outline" size="lg">Compare Plans</Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="rounded-2xl border bg-white p-7 text-left card-lift group">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${b.color}
                                text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
