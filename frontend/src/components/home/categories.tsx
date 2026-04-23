"use client";

import Link from "next/link";
import {
  Gamepad2, Dumbbell, Scissors, Music2, Palette,
  UtensilsCrossed, Camera, Volleyball, type LucideIcon,
} from "lucide-react";

type Category = { key: string; label: string; icon: LucideIcon; color: string };

const CATEGORIES: Category[] = [
  { key: "turf",          label: "Turf",         icon: Volleyball,       color: "from-emerald-500 to-teal-600" },
  { key: "gaming-lounge", label: "Gaming",       icon: Gamepad2,         color: "from-violet-500 to-purple-600" },
  { key: "salon",         label: "Salon & Spa",  icon: Scissors,         color: "from-pink-500 to-rose-600" },
  { key: "fitness",       label: "Fitness",      icon: Dumbbell,         color: "from-orange-500 to-amber-600" },
  { key: "studio",        label: "Studio",       icon: Music2,           color: "from-blue-500 to-indigo-600" },
  { key: "art",           label: "Art & Craft",  icon: Palette,          color: "from-fuchsia-500 to-pink-600" },
  { key: "restaurant",    label: "Restaurant",   icon: UtensilsCrossed,  color: "from-red-500 to-orange-600" },
  { key: "photography",   label: "Photography",  icon: Camera,           color: "from-cyan-500 to-blue-600" },
];

export function PopularCategories() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Explore</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            What are you booking?
          </h2>
          <p className="mt-3 text-muted-foreground text-base max-w-md mx-auto">
            Eight categories. Thousands of venues. One tap away.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.key}
                href={`/marketplace?category=${cat.key}`}
                className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border
                           bg-white card-lift gradient-border text-center"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color}
                                text-white shadow-lg opacity-85 group-hover:opacity-100 group-hover:scale-110
                                transition-all duration-300`}>
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-semibold text-foreground">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
