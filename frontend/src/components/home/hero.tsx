"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LocationSearch, type PlaceSuggestion } from "@/components/location-search";
import { Search, Shield, Zap, Clock, Calendar, MapPin, ArrowRight, Sparkles } from "lucide-react";

const CATEGORIES = [
  { key: "gaming-lounge", label: "Gaming" },
  { key: "turf", label: "Turf" },
  { key: "salon", label: "Salon" },
  { key: "fitness", label: "Fitness" },
  { key: "studio", label: "Studio" },
];

const TRUST = [
  { icon: Shield, label: "Secure booking" },
  { icon: Zap, label: "Instant confirmation" },
  { icon: Clock, label: "24/7 available" },
  { icon: Calendar, label: "Real-time slots" },
];

export function Hero() {
  const [location, setLocation] = useState<PlaceSuggestion | null>(null);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  const bookNow = () => {
    const params = new URLSearchParams();
    if (location) {
      params.set("lat", String(location.latitude));
      params.set("lng", String(location.longitude));
      params.set("place", location.displayName);
    }
    if (category) params.set("category", category);
    if (query.trim()) params.set("q", query.trim());
    window.location.href = `/marketplace${params.toString() ? `?${params}` : ""}`;
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background mesh gradient */}
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute inset-0 dot-pattern opacity-40" />

      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary/15 px-4 py-1.5 text-xs font-medium text-primary mb-8 shadow-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 live-indicator" />
          <Sparkles className="h-3 w-3" />
          Discover · Book · Play
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08]">
          Book anything.{" "}
          <span className="text-gradient">Instantly.</span>
        </h1>

        <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Turfs, gaming lounges, salons and studios — real-time availability,
          zero friction, instant confirmation.
        </p>

        {/* Search card */}
        <div className="mt-10 mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl shadow-black/[0.04] p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_auto] gap-2.5">
              <LocationSearch
                value={location}
                onSelect={setLocation}
                placeholder="Where? (e.g., Kodungallur)"
                size="lg"
              />
              <div className="flex items-center rounded-xl border bg-white/60 px-3">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && bookNow()}
                />
              </div>
              <Button size="lg" onClick={bookNow} className="w-full md:w-auto">
                Book Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-3 pl-1">
              <span className="text-xs text-muted-foreground mr-1">Popular:</span>
              {CATEGORIES.map((c) => {
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(active ? "" : c.key)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200
                      ${active
                        ? "bg-gradient-to-r from-primary to-accent text-white border-transparent shadow-sm"
                        : "bg-white/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-sm"}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {location && (
            <p className="mt-3 text-sm text-primary flex items-center gap-1.5 justify-center animate-scale-in">
              <MapPin className="h-3.5 w-3.5" />
              Results near {location.city || location.displayName}
            </p>
          )}
        </div>

        {/* Trust row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
          {TRUST.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 text-muted-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
