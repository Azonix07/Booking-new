"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { api } from "@/lib/api";
import type { MarketplaceBusiness } from "@/lib/types";
import type { PlaceSuggestion } from "@/components/location-search";
import { getCardImage } from "@/lib/category-images";
import { cn } from "@/lib/utils";
import {
  Gamepad2, Volleyball, Scissors, Dumbbell, Music2, Palette,
  UtensilsCrossed, Camera, Star, MapPin, ArrowRight,
  SlidersHorizontal, X, Shield, Zap, Clock, Calendar,
  TrendingUp, Heart, Instagram, Twitter, Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Filter categories ───────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "gaming-lounge", label: "Gaming",      icon: Gamepad2 },
  { key: "turf",          label: "Turf",         icon: Volleyball },
  { key: "salon",         label: "Salon & Spa",  icon: Scissors },
  { key: "fitness",       label: "Fitness",      icon: Dumbbell },
  { key: "studio",        label: "Studio",       icon: Music2 },
  { key: "art",           label: "Art & Craft",  icon: Palette },
  { key: "restaurant",    label: "Restaurant",   icon: UtensilsCrossed },
  { key: "photography",   label: "Photography",  icon: Camera },
];

const SORT_OPTIONS = [
  { key: "rating",   label: "Top Rated" },
  { key: "nearest",  label: "Nearest" },
  { key: "newest",   label: "Newest" },
];

const TRUST_STATS = [
  { value: "10K+",  label: "Bookings made",     icon: Calendar,   tint: "from-blue-500 to-indigo-600" },
  { value: "500+",  label: "Verified venues",   icon: Shield,     tint: "from-emerald-500 to-teal-600" },
  { value: "4.8★",  label: "Average rating",    icon: Star,       tint: "from-amber-500 to-orange-600" },
  { value: "99%",   label: "Instant confirms",  icon: TrendingUp, tint: "from-violet-500 to-purple-600" },
];

export default function HomePage() {
  const [businesses, setBusinesses] = useState<MarketplaceBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState<PlaceSuggestion | null>(null);

  // Listen for location changes from the navbar
  useEffect(() => {
    const handler = (e: CustomEvent<PlaceSuggestion | null>) => {
      setLocation(e.detail);
    };
    window.addEventListener("navbar-location-change" as any, handler);
    return () => window.removeEventListener("navbar-location-change" as any, handler);
  }, []);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      let data: any;

      if (location?.latitude && location?.longitude) {
        const params = new URLSearchParams();
        params.set("latitude", location.latitude.toString());
        params.set("longitude", location.longitude.toString());
        params.set("radiusKm", "50");
        params.set("limit", "40");
        if (activeCategory) params.set("category", activeCategory);
        const resp = await api.get<any>(`/marketplace/nearby?${params}`);
        data = resp?.businesses || resp || [];
      } else if (activeCategory) {
        const resp = await api.get<any>(`/marketplace/browse?category=${encodeURIComponent(activeCategory)}&limit=40`);
        data = resp?.businesses || resp || [];
      } else {
        const resp = await api.get<any>(`/marketplace/featured?limit=40`);
        data = resp || [];
      }

      let results = Array.isArray(data) ? data : [];

      const planWeight: Record<string, number> = { full_service: 4, ai: 3, basic: 2, free: 1 };
      const getPlanWeight = (b: any) => planWeight[b.plan] || 0;

      results.sort((a: any, b: any) => {
        const tierDiff = getPlanWeight(b) - getPlanWeight(a);
        if (tierDiff !== 0) return tierDiff;

        if (sortBy === "rating") {
          return (b.rating?.average || 0) - (a.rating?.average || 0);
        } else if (sortBy === "nearest" && location) {
          return (a.distanceKm || 999) - (b.distanceKm || 999);
        } else if (sortBy === "newest") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return (b.rating?.average || 0) - (a.rating?.average || 0);
      });

      setBusinesses(results);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [location, activeCategory, sortBy]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const toggleCategory = (key: string) => {
    setActiveCategory((prev) => (prev === key ? "" : key));
  };

  const sectionTitle = activeCategory
    ? `${CATEGORIES.find(c => c.key === activeCategory)?.label || "Venues"}${location ? ` near ${location.city || location.displayName}` : ""}`
    : location
      ? `Discover near ${location.city || location.displayName}`
      : "Top-rated venues for you";

  const sectionSub = activeCategory
    ? "Filtered by category"
    : location
      ? "Sorted by relevance and proximity"
      : "Hand-picked, real-time available";

  return (
    <>
      <Navbar onLocationChange={setLocation} />

      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50/50">
        {/* ─── HERO CAROUSEL (hero + ads + promote) ───────────────────── */}
        <HeroCarousel />

        {/* ─── FILTER BAR ────────────────────────────────────────────────── */}
        <div className="sticky top-16 z-40 bg-white/85 backdrop-blur-xl border-y border-border/40 shadow-[0_1px_12px_-6px_rgba(0,0,0,0.05)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all shrink-0 ${
                  showFilters || activeCategory
                    ? "bg-gradient-to-r from-primary to-accent text-white border-transparent shadow-md shadow-primary/20"
                    : "bg-white text-foreground border-border/70 hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeCategory && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">1</span>
                )}
              </button>

              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => toggleCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? "bg-primary/10 text-primary border-primary/40 shadow-sm"
                        : "bg-white text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground hover:shadow-sm"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                    {active && (
                      <X
                        className="h-3 w-3 ml-0.5"
                        onClick={(e) => { e.stopPropagation(); setActiveCategory(""); }}
                      />
                    )}
                  </button>
                );
              })}

              <div className="flex-1" />

              <div className="hidden sm:flex items-center gap-1 shrink-0 rounded-full bg-muted/50 p-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      sortBy === opt.key
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {showFilters && (
              <div className="pb-3 pt-1 border-t border-border/30 animate-fade-in">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">Sort by:</span>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        sortBy === opt.key
                          ? "bg-foreground text-background border-foreground"
                          : "bg-white text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {activeCategory && (
                    <button
                      onClick={() => { setActiveCategory(""); setShowFilters(false); }}
                      className="ml-auto text-xs text-primary font-semibold hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── LOCATION CONTEXT BAR ──────────────────────────────────────── */}
        {location && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 border border-primary/15 rounded-full px-4 py-2 w-fit">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Showing results near <span className="font-semibold text-foreground">{location.city || location.displayName}</span>
              <button
                onClick={() => {
                  setLocation(null);
                  window.dispatchEvent(new CustomEvent("clear-navbar-location"));
                }}
                className="ml-1 text-xs text-primary hover:underline font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ─── CONTENT ───────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
          {/* Section header */}
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {sectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {loading ? "Loading venues..." : `${businesses.length} venue${businesses.length !== 1 ? "s" : ""} · ${sectionSub}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-border/60 overflow-hidden animate-pulse">
                  <div className="aspect-[5/3] bg-gray-200" />
                  <div className="p-3 flex items-start gap-2.5">
                    <div className="h-11 w-11 rounded-xl bg-gray-200 -mt-7 ring-3 ring-white" />
                    <div className="flex-1 pt-0.5 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-gray-200" />
                      <div className="h-2.5 w-1/2 rounded bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="relative mb-8">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center">
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="text-primary/30">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
                    <path d="M35 45c0-8.284 6.716-15 15-15s15 6.716 15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="50" cy="60" r="3" fill="currentColor" />
                    <path d="M30 70 L50 80 L70 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-orange-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                No venues found
              </h2>
              <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
                {location
                  ? `We couldn't find any businesses near ${location.city || location.displayName}. Try a different location or browse all categories.`
                  : "Set your location in the search bar above to discover businesses near you."
                }
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {!location && (
                  <Button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("focus-navbar-location"));
                    }}
                    className="rounded-xl gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Set Location
                  </Button>
                )}
                {activeCategory && (
                  <Button
                    variant="outline"
                    onClick={() => setActiveCategory("")}
                    className="rounded-xl"
                  >
                    Clear filter
                  </Button>
                )}
                <Link href="/list-your-business">
                  <Button variant="outline" className="rounded-xl gap-2">
                    List your business
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {businesses.map((biz, i) => (
                <div key={biz._id} className="fade-in-up" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
                  <BusinessSlotCard business={biz} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── TRUST / SOCIAL PROOF BAND ─────────────────────────────────── */}
        {!loading && businesses.length > 0 && (
          <section className="relative overflow-hidden py-16 sm:py-20 px-4 sm:px-6 mt-4">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-accent/[0.02] to-transparent" />
            <div className="absolute inset-0 dot-pattern opacity-25" />

            <div className="relative mx-auto max-w-6xl">
              <div className="text-center mb-10">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Why Bokingo</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Trusted by thousands. <span className="text-gradient">Built for speed.</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                {TRUST_STATS.map(({ value, label, icon: Icon, tint }) => (
                  <div
                    key={label}
                    className="group relative rounded-2xl bg-white border border-border/60 p-5 sm:p-6 text-center card-lift overflow-hidden"
                  >
                    <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${tint} opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-300`} />
                    <div className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-md mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="relative text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                      {value}
                    </div>
                    <div className="relative text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link href="/list-your-business">
                  <Button size="lg" className="rounded-xl gap-2">
                    Run a venue? List it free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        <Footer />
      </main>
    </>
  );
}

// ─── Business card — brand-forward, single face, compact ─────────────────────

const ACCENT_SETS = [
  "from-violet-500 to-indigo-600",
  "from-rose-500 to-fuchsia-600",
  "from-cyan-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-cyan-500",
];

function BusinessSlotCard({ business }: { business: MarketplaceBusiness }) {
  const router = useRouter();
  const initial = business.name?.charAt(0)?.toUpperCase() || "B";
  const categoryLabel = business.category?.replace(/-/g, " ") || "";

  const accentIdx = business.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENT_SETS.length;
  const accent = ACCENT_SETS[accentIdx];
  const cardImage = getCardImage(business);

  const isPremium = business.plan === "full_service";
  const planLabel =
    business.plan === "full_service" ? "Premium"
      : business.plan === "ai" ? "AI"
      : business.plan === "standard" ? "Pro"
      : null;

  return (
    <div
      onClick={() => router.push(`/book/${business.slug}`)}
      className="group cursor-pointer rounded-2xl bg-white border border-border/60 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
    >
      {/* Cover image band */}
      <div className="relative aspect-[5/3] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardImage}
          alt={business.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {/* Subtle darken for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />

        {/* Top-left plan badge */}
        {planLabel && (
          <div className={cn(
            "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm",
            isPremium
              ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
              : "bg-white/90 text-foreground"
          )}>
            {isPremium && "✨ "}{planLabel}
          </div>
        )}

        {/* Top-right distance */}
        {business.distanceKm != null && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 shadow-sm flex items-center gap-0.5 backdrop-blur-md">
            <MapPin className="h-2.5 w-2.5 text-primary" />
            {business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)}m` : `${business.distanceKm.toFixed(1)}km`}
          </div>
        )}

        {/* Favorite icon — future */}
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="Favorite"
          className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-110"
        >
          <Heart className="h-4 w-4 text-rose-500" />
        </button>
      </div>

      {/* Info row — brand-focused */}
      <div className="p-3 sm:p-3.5">
        <div className="flex items-start gap-2.5">
          {/* Logo square (not circle — looks more like a brand mark) */}
          <div className="shrink-0 -mt-7 relative">
            {business.branding?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.branding.logo}
                alt={business.name}
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl object-cover ring-3 ring-white shadow-md bg-white"
              />
            ) : (
              <div className={cn(
                "h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-white text-base sm:text-lg font-bold ring-3 ring-white shadow-md bg-gradient-to-br",
                accent
              )}>
                {initial}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-bold text-sm sm:text-[15px] text-foreground leading-tight truncate group-hover:text-primary transition-colors">
              {business.name}
            </h3>
            <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground capitalize truncate">
              {categoryLabel}
              {business.address?.city ? ` · ${business.address.city}` : ""}
            </p>
          </div>

          {/* Rating chip on right */}
          {business.rating?.average > 0 && (
            <div className="shrink-0 flex items-center gap-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md px-1.5 py-0.5 text-[11px] font-bold">
              <Star className="h-2.5 w-2.5 fill-emerald-600 text-emerald-600" />
              {business.rating.average.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-gradient-to-b from-white to-gray-50/80 mt-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center group">
              <Image
                src="/images/brand/Bokingo_large.png"
                alt="Bokingo"
                width={130}
                height={36}
                className="transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Book anything, anywhere — instantly. The fastest way to discover and reserve venues near you.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: Instagram, label: "Instagram" },
                { icon: Twitter,   label: "Twitter" },
                { icon: Facebook,  label: "Facebook" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Customers</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Explore venues</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Sign up</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Log in</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Business</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/list-your-business" className="hover:text-primary transition-colors">List your business</Link></li>
              <li><Link href="/list-your-business/full-service" className="hover:text-primary transition-colors">Full-service</Link></li>
              <li><Link href="/list-your-business#plans" className="hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Bokingo. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-rose-400 fill-rose-400" /> in India
          </span>
        </div>
      </div>
    </footer>
  );
}
