"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { MarketplaceBusiness } from "@/lib/types";
import { BusinessCard } from "./business-card";
import { BusinessCardSkeleton } from "./skeleton";
import { ArrowRight, Loader2, MapPin, Navigation } from "lucide-react";

type LocationState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "denied" }
  | { phase: "error"; message: string }
  | { phase: "ready"; lat: number; lng: number };

export function NearbySection() {
  const [loc, setLoc] = useState<LocationState>({ phase: "idle" });
  const [businesses, setBusinesses] = useState<MarketplaceBusiness[] | null>(null);

  useEffect(() => {
    if (loc.phase !== "ready") return;
    setBusinesses(null);
    const url = `/marketplace/nearby?latitude=${loc.lat}&longitude=${loc.lng}&radiusKm=25&limit=6`;
    api
      .get<MarketplaceBusiness[]>(url)
      .then((d) => setBusinesses(d ?? []))
      .catch(() => setBusinesses([]));
  }, [loc]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLoc({ phase: "error", message: "Geolocation not supported" });
      return;
    }
    setLoc({ phase: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLoc({
          phase: "ready",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLoc({ phase: "denied" });
        } else {
          setLoc({ phase: "error", message: err.message });
        }
      },
      { timeout: 8000, maximumAge: 60_000 },
    );
  };

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Near You
            </h2>
            <p className="mt-2 text-muted-foreground text-lg">
              Discover places just a short trip away
            </p>
          </div>
          {loc.phase !== "ready" && (
            <Button
              onClick={requestLocation}
              variant="outline"
              className="rounded-xl gap-2 sm:self-end"
              disabled={loc.phase === "loading"}
            >
              {loc.phase === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              Use my location
            </Button>
          )}
        </motion.div>

        {loc.phase === "idle" && (
          <EmptyState
            title="Find places near you"
            description="Share your location to see businesses within 25 km."
            icon={<MapPin className="h-6 w-6" />}
          />
        )}

        {loc.phase === "denied" && (
          <EmptyState
            title="Location access denied"
            description="Enable it in your browser to see nearby places, or search by city above."
            icon={<MapPin className="h-6 w-6" />}
          />
        )}

        {loc.phase === "error" && (
          <EmptyState
            title="Couldn't get your location"
            description={loc.message}
            icon={<MapPin className="h-6 w-6" />}
          />
        )}

        {loc.phase === "ready" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses === null
                ? Array.from({ length: 6 }).map((_, i) => (
                    <BusinessCardSkeleton key={i} />
                  ))
                : businesses.length === 0
                  ? null
                  : businesses.map((b, i) => (
                      <motion.div
                        key={b._id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.35, delay: (i % 3) * 0.08 }}
                      >
                        <BusinessCard business={b} showDistance />
                      </motion.div>
                    ))}
            </div>

            {businesses !== null && businesses.length === 0 && (
              <EmptyState
                title="Nothing listed near you yet"
                description="We're growing fast — try searching by category or city above."
                icon={<MapPin className="h-6 w-6" />}
              />
            )}

            {businesses && businesses.length > 0 && (
              <div className="mt-8 text-center">
                <Link href={`/marketplace?lat=${loc.lat}&lng=${loc.lng}`}>
                  <Button variant="outline" className="rounded-xl gap-2">
                    See all nearby
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/60 py-16 px-6 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
}
