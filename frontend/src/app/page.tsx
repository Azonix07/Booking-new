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
import { Badge } from "@/components/ui/badge";
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border bg-white overflow-hidden animate-pulse h-64">
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-gray-200" />
                  </div>
                  <div className="flex items-center justify-center h-24">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

// ─── Flip card with expand-on-linger ─────────────────────────────────────────

function BusinessSlotCard({ business }: { business: MarketplaceBusiness }) {
  const router = useRouter();
  const initial = business.name?.charAt(0)?.toUpperCase() || "B";
  const categoryLabel = business.category?.replace(/-/g, " ") || "";
  const [flipped, setFlipped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lingerTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleMouseEnter = () => {
    setFlipped(true);
    lingerTimer.current = setTimeout(() => setExpanded(true), 1200);
  };

  const handleMouseLeave = () => {
    clearTimeout(lingerTimer.current);
    setFlipped(false);
    setExpanded(false);
  };

  // Expanded overlay (portal-like)
  if (expanded) {
    return (
      <>
        {/* Placeholder to keep grid space */}
        <div className="h-64" />
        {/* Expanded overlay */}
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => { setExpanded(false); setFlipped(false); }}
        >
          <div
            className="w-[90vw] max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Expanded header */}
            <div className="relative h-44 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/15 flex items-center justify-center">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,.06) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
              {business.branding?.logo ? (
                <img src={business.branding.logo} alt={business.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-xl" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-4xl font-bold shadow-xl ring-4 ring-white">
                  {initial}
                </div>
              )}
              {business.distanceKm != null && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 shadow flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  {business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)}m` : `${business.distanceKm.toFixed(1)}km`}
                </div>
              )}
              {business.plan && business.plan !== "free" && (
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className={`text-xs ${business.plan === "ai" ? "bg-violet-100 text-violet-700" : business.plan === "full_service" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                    {business.plan === "full_service" ? "Premium" : business.plan === "ai" ? "AI" : "Pro"}
                  </Badge>
                </div>
              )}
            </div>

            {/* Expanded body */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{business.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{categoryLabel}</p>
                </div>
                {business.rating?.average > 0 && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
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
                  {business.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-primary/5 text-primary font-medium">{tag}</span>
                  ))}
                </div>
              )}

              <Button
                className="w-full rounded-xl mt-2 gap-2"
                onClick={() => router.push(`/book/${business.slug}`)}
              >
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="flip-card h-64 cursor-pointer"
      style={{ perspective: "800px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(`/book/${business.slug}`)}
    >
      <div
        className="flip-card-inner relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT ── */}
        <div
          className="absolute inset-0 rounded-2xl border bg-white overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Top gradient area with circle profile */}
          <div className="relative h-40 bg-gradient-to-br from-primary/8 via-accent/5 to-primary/12 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,.05) 1px, transparent 0)", backgroundSize: "16px 16px" }} />

            {business.branding?.logo ? (
              <img src={business.branding.logo} alt={business.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-lg" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-primary/25 ring-4 ring-white">
                {initial}
              </div>
            )}

            {business.distanceKm != null && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 shadow-sm flex items-center gap-1 backdrop-blur-sm">
                <MapPin className="h-2.5 w-2.5 text-primary" />
                {business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)}m` : `${business.distanceKm.toFixed(1)}km`}
              </div>
            )}

            {business.plan && business.plan !== "free" && (
              <div className="absolute top-2.5 left-2.5">
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${business.plan === "ai" ? "bg-violet-100 text-violet-700" : business.plan === "full_service" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                  {business.plan === "full_service" ? "Premium" : business.plan === "ai" ? "AI" : "Pro"}
                </Badge>
              </div>
            )}
          </div>

          {/* Name only */}
          <div className="flex items-center justify-center h-24 px-4">
            <h3 className="font-semibold text-sm text-foreground text-center line-clamp-2">
              {business.name}
            </h3>
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className="absolute inset-0 rounded-2xl border bg-white overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex flex-col items-center justify-center h-full p-4 text-center gap-2">
            {/* Small profile */}
            {business.branding?.logo ? (
              <img src={business.branding.logo} alt={business.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-lg font-bold">
                {initial}
              </div>
            )}

            <h3 className="font-bold text-sm">{business.name}</h3>

            <p className="text-xs text-muted-foreground capitalize">{categoryLabel}</p>

            {business.rating?.average > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold">{business.rating.average.toFixed(1)}</span>
                {business.rating.count > 0 && <span className="text-[10px] text-muted-foreground">({business.rating.count})</span>}
              </div>
            )}

            {business.address?.city && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {business.address.city}
              </p>
            )}

            <div className="mt-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
              Book Now <ArrowRight className="h-3 w-3" />
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
