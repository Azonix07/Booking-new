"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/page-loader";
import { LocationSearch, type PlaceSuggestion } from "@/components/location-search";
import { MapPin, Star, Search, X } from "lucide-react";
import type { MarketplaceBusiness } from "@/lib/types";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const placeName = searchParams.get("place") || "";

  const [businesses, setBusinesses] = useState<MarketplaceBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(
    lat && lng
      ? {
          placeId: "",
          displayName: placeName,
          city: placeName.split(",")[0] || "",
          state: "",
          country: "",
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          type: "place",
        }
      : null
  );

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      let data: any;

      // If we have coordinates, use nearby search
      if (selectedPlace?.latitude && selectedPlace?.longitude) {
        const params = new URLSearchParams();
        params.set("latitude", selectedPlace.latitude.toString());
        params.set("longitude", selectedPlace.longitude.toString());
        params.set("radiusKm", "50");
        if (category) params.set("category", category);
        if (q) params.set("search", q);

        const resp = await api.get<any>(`/marketplace/nearby?${params.toString()}`);
        data = resp?.businesses || resp || [];
      } else if (q) {
        data = await api.get<any>(`/marketplace/search?q=${encodeURIComponent(q)}`);
      } else if (category) {
        const resp = await api.get<any>(`/marketplace/browse?category=${encodeURIComponent(category)}`);
        data = resp?.businesses || resp || [];
      } else {
        const resp = await api.get<any>(`/marketplace/featured?limit=20`);
        data = resp || [];
      }

      setBusinesses(Array.isArray(data) ? data : []);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [q, category, selectedPlace]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedPlace) {
      params.set("lat", selectedPlace.latitude.toString());
      params.set("lng", selectedPlace.longitude.toString());
      params.set("place", selectedPlace.displayName);
    }
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("category", category);
    router.push(`/marketplace?${params.toString()}`);
  };

  const handleLocationSelect = (place: PlaceSuggestion) => {
    setSelectedPlace(place);
    const params = new URLSearchParams();
    params.set("lat", place.latitude.toString());
    params.set("lng", place.longitude.toString());
    params.set("place", place.displayName);
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("category", category);
    router.push(`/marketplace?${params.toString()}`);
  };

  const clearLocation = () => {
    setSelectedPlace(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("category", category);
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Search bar with location */}
      <div className="space-y-3 mb-8">
        <div className="flex gap-3">
          <LocationSearch
            value={selectedPlace}
            onSelect={handleLocationSelect}
            placeholder="Enter city or area..."
            className="w-72 shrink-0"
            size="md"
          />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search businesses or services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Active filters */}
      {(q || category || selectedPlace) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedPlace && (
            <Badge variant="secondary" className="gap-1.5 pr-1.5">
              <MapPin className="h-3 w-3" />
              {selectedPlace.displayName}
              <button onClick={clearLocation} className="ml-1 rounded-full hover:bg-muted p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {q && <Badge variant="secondary">Search: {q}</Badge>}
          {category && <Badge variant="secondary">Category: {category}</Badge>}
          <Link href="/marketplace">
            <Badge variant="outline" className="cursor-pointer">Clear All</Badge>
          </Link>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <PageLoader />
      ) : businesses.length === 0 ? (
        <div className="text-center py-20">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium">No businesses found</p>
          <p className="text-muted-foreground mt-1">
            {selectedPlace
              ? `Try a different location or broaden your search area`
              : `Enter a location to discover businesses near you`}
          </p>
        </div>
      ) : (
        <>
          {selectedPlace && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing {businesses.length} business{businesses.length !== 1 ? "es" : ""} near{" "}
              <span className="font-medium text-foreground">{selectedPlace.city || selectedPlace.displayName}</span>
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => (
              <Link key={biz._id} href={`/book/${biz.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="h-36 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    {biz.branding?.logo ? (
                      <img src={biz.branding.logo} alt={biz.name} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                        {biz.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{biz.name}</h3>
                      {biz.rating?.average != null && biz.rating.average > 0 && (
                        <div className="flex items-center text-sm text-yellow-600">
                          <Star className="h-4 w-4 fill-current mr-1" />
                          {biz.rating.average.toFixed(1)}
                        </div>
                      )}
                    </div>
                    {biz.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">{biz.category}</Badge>
                    )}
                    {(biz.address?.city || biz.distanceKm) && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {biz.address?.city}
                        {biz.distanceKm != null && (
                          <span className="ml-1 text-primary font-medium">
                            ({biz.distanceKm < 1
                              ? `${Math.round(biz.distanceKm * 1000)}m`
                              : `${biz.distanceKm.toFixed(1)}km`} away)
                          </span>
                        )}
                      </p>
                    )}
                    {biz.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{biz.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MarketplaceContent />
    </Suspense>
  );
}
