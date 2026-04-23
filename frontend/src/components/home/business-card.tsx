"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { MarketplaceBusiness } from "@/lib/types";

export function BusinessCard({
  business,
  showDistance = false,
}: {
  business: MarketplaceBusiness;
  showDistance?: boolean;
}) {
  return (
    <Link href={`/marketplace/${business.slug}`} prefetch={false} className="block h-full">
      <div className="group h-full rounded-2xl border bg-white overflow-hidden card-lift gradient-border">
        {/* Image area */}
        <div className="relative h-40 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 flex items-center justify-center overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 dot-pattern opacity-30" />

          {business.branding?.logo ? (
            <img
              src={business.branding.logo}
              alt={business.name}
              loading="lazy"
              className="relative h-16 w-16 rounded-xl object-cover ring-2 ring-white shadow-md"
            />
          ) : (
            <div className="relative h-16 w-16 rounded-xl flex items-center justify-center gradient-primary text-white text-xl font-semibold shadow-md shadow-primary/25">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}

          {showDistance && business.distanceKm != null && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-white shadow-sm flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              {business.distanceKm.toFixed(1)} km
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {business.name}
          </h3>

          {business.category && (
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {business.category.replace(/-/g, " ")}
            </p>
          )}

          {business.address?.city && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {business.address?.city}
            </p>
          )}

          {business.rating != null && business.rating > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium">{Number(business.rating).toFixed(1)}</span>
              {business.reviewCount != null && (
                <span className="text-xs text-muted-foreground">
                  ({business.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
