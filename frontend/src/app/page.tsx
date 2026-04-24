"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { api } from "@/lib/api";
import type { MarketplaceBusiness } from "@/lib/types";
import type { PlaceSuggestion } from "@/components/location-search";
import {
  Gamepad2, Volleyball, Scissors, Dumbbell, Music2, Palette,
  UtensilsCrossed, Camera, Star, MapPin, Clock, Users, ArrowRight,
  SlidersHorizontal, X,
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

export default function HomePage() {
  const router = useRouter();
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

      // Client-side sort
      if (sortBy === "rating") {
        results.sort((a: any, b: any) => (b.rating?.average || 0) - (a.rating?.average || 0));
      } else if (sortBy === "nearest" && location) {
        results.sort((a: any, b: any) => (a.distanceKm || 999) - (b.distanceKm || 999));
      } else if (sortBy === "newest") {
        results.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }

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

  return (
    <>
      <Navbar onLocationChange={setLocation} />

      <main className="min-h-screen bg-gray-50/50">
        {/* Filter bar */}
        <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shrink-0 ${
                  showFilters || activeCategory
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeCategory && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">1</span>
                )}
              </button>

              {/* Category pills */}
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => toggleCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                        : "bg-white text-muted-foreground border-border/60 hover:border-primary/30 hover:text-foreground"
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

              {/* Sort pills */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      sortBy === opt.key
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="pb-3 pt-1 border-t border-border/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Sort:</span>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        sortBy === opt.key
                          ? "bg-foreground text-background border-foreground"
                          : "bg-white text-muted-foreground border-border/60 hover:border-primary/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {activeCategory && (
                    <button
                      onClick={() => { setActiveCategory(""); setShowFilters(false); }}
                      className="ml-auto text-xs text-primary font-medium hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location context bar */}
        {location && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Showing results near <span className="font-medium text-foreground">{location.city || location.displayName}</span>
              <button
                onClick={() => {
                  setLocation(null);
                  window.dispatchEvent(new CustomEvent("clear-navbar-location"));
                }}
                className="text-xs text-primary hover:underline ml-1"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          {loading ? (
            /* Skeleton grid */
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-3xl bg-white overflow-hidden animate-pulse aspect-[3/4]">
                  <div className="h-[72%] bg-gray-100 flex items-center justify-center">
                    <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-[28%] flex flex-col items-center justify-center gap-2">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-50 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            /* No businesses illustration */
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
                No shops found near you
              </h2>
              <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
                {location
                  ? `We couldn't find any businesses near ${location.city || location.displayName}. Try a different location or browse all categories.`
                  : "Set your location in the search bar above to discover businesses near you."
                }
              </p>
              <div className="flex gap-3">
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
            /* Business cards grid */
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {businesses.length} business{businesses.length !== 1 ? "es" : ""} found
                {activeCategory && (
                  <> in <span className="font-medium text-foreground capitalize">{activeCategory.replace(/-/g, " ")}</span></>
                )}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {businesses.map((biz) => (
                  <BusinessSlotCard key={biz._id} business={biz} />
                ))}
              </div>
            </>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
}

// ─── Tall portrait flip card ─────────────────────────────────────────────────

const GRADIENT_SETS = [
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-cyan-500 via-teal-500 to-emerald-600",
  "from-amber-500 via-orange-500 to-red-500",
  "from-blue-500 via-indigo-500 to-violet-600",
  "from-emerald-500 via-green-500 to-teal-600",
  "from-pink-500 via-rose-400 to-orange-500",
  "from-indigo-500 via-blue-500 to-cyan-500",
];

function BusinessSlotCard({ business }: { business: MarketplaceBusiness }) {
  const router = useRouter();
  const initial = business.name?.charAt(0)?.toUpperCase() || "B";
  const categoryLabel = business.category?.replace(/-/g, " ") || "";
  const [flipped, setFlipped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lingerTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Deterministic gradient based on name
  const gradientIdx = business.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENT_SETS.length;
  const gradient = GRADIENT_SETS[gradientIdx];

  const handleMouseEnter = () => {
    setFlipped(true);
    lingerTimer.current = setTimeout(() => setExpanded(true), 1200);
  };

  const handleMouseLeave = () => {
    clearTimeout(lingerTimer.current);
    setFlipped(false);
    setExpanded(false);
  };

  // ── Expanded overlay ──
  if (expanded) {
    return (
      <>
        <div className="aspect-[3/4]" />
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => { setExpanded(false); setFlipped(false); }}
        >
          <div
            className="w-[92vw] max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Expanded gradient header */}
            <div className={`relative h-52 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
              <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              {business.branding?.logo ? (
                <img src={business.branding.logo} alt={business.name} className="relative h-28 w-28 rounded-full object-cover ring-4 ring-white/80 shadow-2xl" />
              ) : (
                <div className="relative h-28 w-28 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-5xl font-bold shadow-2xl ring-4 ring-white/30">
                  {initial}
                </div>
              )}
              {business.distanceKm != null && (
                <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 shadow-lg flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  {business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)}m` : `${business.distanceKm.toFixed(1)}km`}
                </div>
              )}
              {business.plan && business.plan !== "free" && (
                <div className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 shadow-lg">
                  {business.plan === "full_service" ? "✨ Premium" : business.plan === "ai" ? "🤖 AI" : "⚡ Pro"}
                </div>
              )}
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{business.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{categoryLabel}</p>
                </div>
                {business.rating?.average > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold">{business.rating.average.toFixed(1)}</span>
                    {business.rating.count > 0 && <span className="text-xs text-muted-foreground">({business.rating.count})</span>}
                  </div>
                )}
              </div>

              {business.address?.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {business.address.city}{business.address.state ? `, ${business.address.state}` : ""}
                </p>
              )}

              {business.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{business.description}</p>
              )}

              {business.tags && business.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {business.tags.slice(0, 6).map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs bg-primary/5 text-primary font-medium">{tag}</span>
                  ))}
                </div>
              )}

              <Button className="w-full rounded-xl mt-2 gap-2 h-11" onClick={() => router.push(`/book/${business.slug}`)}>
                Book Now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="flip-card aspect-[3/4] cursor-pointer"
      style={{ perspective: "1000px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(`/book/${business.slug}`)}
    >
      <div
        className="relative w-full h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT FACE ── */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Vibrant gradient background fills 60% */}
          <div className={`relative h-[72%] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,.2) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
            {/* Bottom fade to white */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />

            {/* Big circle avatar */}
            {business.branding?.logo ? (
              <img src={business.branding.logo} alt={business.name} className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover ring-[5px] ring-white/80 shadow-2xl" />
            ) : (
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-5xl sm:text-6xl font-bold shadow-2xl ring-[5px] ring-white/30">
                {initial}
              </div>
            )}

            {/* Badges */}
            {business.distanceKm != null && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 shadow-lg flex items-center gap-1 backdrop-blur-sm">
                <MapPin className="h-2.5 w-2.5 text-primary" />
                {business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)}m` : `${business.distanceKm.toFixed(1)}km`}
              </div>
            )}
            {business.plan && business.plan !== "free" && (
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 shadow-lg backdrop-blur-sm">
                {business.plan === "full_service" ? "✨ Premium" : business.plan === "ai" ? "🤖 AI" : "⚡ Pro"}
              </div>
            )}
          </div>

          {/* Name + rating at bottom 38% */}
          <div className="h-[28%] flex flex-col items-center justify-center px-4 bg-white">
            <h3 className="font-bold text-sm sm:text-base text-foreground text-center leading-tight line-clamp-2">
              {business.name}
            </h3>
            {business.rating?.average > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-foreground">{business.rating.average.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground">· {categoryLabel}</span>
              </div>
            )}
            {!business.rating?.average && categoryLabel && (
              <p className="text-xs text-muted-foreground capitalize mt-1.5">{categoryLabel}</p>
            )}
          </div>
        </div>

        {/* ── BACK FACE ── */}
        <div
          className={`absolute inset-0 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br ${gradient}`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,.2) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative flex flex-col items-center justify-center h-full p-5 text-center gap-2.5">
            {/* Profile */}
            {business.branding?.logo ? (
              <img src={business.branding.logo} alt={business.name} className="h-16 w-16 rounded-full object-cover ring-3 ring-white/50 shadow-xl" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-2xl font-bold ring-3 ring-white/30 shadow-xl">
                {initial}
              </div>
            )}

            <h3 className="font-bold text-base text-white drop-shadow-sm">{business.name}</h3>

            <p className="text-xs text-white/80 capitalize font-medium">{categoryLabel}</p>

            {business.rating?.average > 0 && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                <span className="text-xs font-bold text-white">{business.rating.average.toFixed(1)}</span>
                {business.rating.count > 0 && <span className="text-[10px] text-white/70">({business.rating.count})</span>}
              </div>
            )}

            {business.address?.city && (
              <p className="text-xs text-white/80 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {business.address.city}{business.address.state ? `, ${business.address.state}` : ""}
              </p>
            )}

            <div className="mt-2 px-5 py-2 rounded-full bg-white text-foreground text-xs font-bold flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform">
              Book Now <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t bg-white py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/images/brand/Bokingo_large.png"
                alt="Bokingo"
                width={120}
                height={32}
              />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Book anything, anywhere — instantly.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-3">Customers</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Explore</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Sign up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-3">Business</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/list-your-business" className="hover:text-primary transition-colors">List your business</Link></li>
              <li><Link href="/list-your-business/full-service" className="hover:text-primary transition-colors">Full-service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-3">Account</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/login" className="hover:text-primary transition-colors">Log in</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Sign up</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Bokingo</span>
          <span className="flex items-center gap-1">
            Made with <span className="text-red-400">♥</span> in India
          </span>
        </div>
      </div>
    </footer>
  );
}
