"use client";

import { MapPin, Star, Wifi } from "lucide-react";
import type { MarketplaceBusiness } from "@/lib/types";

interface BookingHeroProps {
  business: MarketplaceBusiness;
  lastRefresh: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function BookingHero({ business, lastRefresh, isRefreshing, onRefresh }: BookingHeroProps) {
  return (
    <div className="relative bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 md:py-16 border-b">
      <div className="max-w-3xl mx-auto text-center">
        {/* Live badge */}
        <div className="mb-5">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white text-xs font-medium text-muted-foreground hover:border-primary/30 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <Wifi className="h-3 w-3" />
            Live Availability
            {lastRefresh && (
              <span className="opacity-60">
                · {lastRefresh.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </button>
        </div>

        {/* Business name */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          {business.name}
        </h1>

        {/* Subtitle info */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-sm text-muted-foreground">
          {business.rating?.average > 0 && (
            <span className="flex items-center gap-1.5 border rounded-full px-3 py-1 bg-white">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-foreground font-medium">{business.rating?.average?.toFixed(1)}</span>
              {(business.rating?.count ?? 0) > 0 && (
                <span className="text-muted-foreground">({business.rating?.count})</span>
              )}
            </span>
          )}
          {business.address?.city && (
            <span className="flex items-center gap-1.5 border rounded-full px-3 py-1 bg-white">
              <MapPin className="h-3.5 w-3.5" />
              {business.address?.city}{business.address?.state ? `, ${business.address.state}` : ""}
            </span>
          )}
        </div>

        {/* Tagline */}
        <p className="mt-4 text-muted-foreground text-sm">
          Choose your experience, pick a time, and book instantly
        </p>
      </div>
    </div>
  );
}
