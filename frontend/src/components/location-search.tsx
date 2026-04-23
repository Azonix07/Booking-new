"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, Navigation, X } from "lucide-react";
import { api } from "@/lib/api";

export interface PlaceSuggestion {
  placeId: string;
  displayName: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface LocationSearchProps {
  value?: PlaceSuggestion | null;
  onSelect: (place: PlaceSuggestion) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocation?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LocationSearch({
  value,
  onSelect,
  placeholder = "Search city or area...",
  className = "",
  showCurrentLocation = true,
  size = "md",
}: LocationSearchProps) {
  const [query, setQuery] = useState(value?.displayName || "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update query when value changes externally
  useEffect(() => {
    if (value?.displayName) {
      setQuery(value.displayName);
    }
  }, [value?.displayName]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaces = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const results = await api.get<PlaceSuggestion[]>(
        `/location/autocomplete?q=${encodeURIComponent(q.trim())}`
      );
      setSuggestions(Array.isArray(results) ? results : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(val), 300);
  };

  const handleSelect = (place: PlaceSuggestion) => {
    setQuery(place.displayName);
    setIsOpen(false);
    setSuggestions([]);
    onSelect(place);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await api.get<PlaceSuggestion>(
            `/location/reverse?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          if (result) {
            handleSelect(result);
          }
        } catch {
          // Silently fail
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sizeClasses = {
    sm: "py-2 px-3 text-sm",
    md: "py-3 px-4 text-sm",
    lg: "py-4 px-5 text-base",
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <MapPin className={`absolute left-3 ${size === "lg" ? "h-5 w-5" : "h-4 w-4"} text-muted-foreground pointer-events-none`} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (suggestions.length > 0 || query.length >= 2) setIsOpen(true); }}
          placeholder={placeholder}
          className={`w-full ${sizeClasses[size]} ${size === "lg" ? "pl-10" : "pl-9"} pr-20 rounded-xl border border-border bg-background outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground/60`}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && !loading && (
            <button onClick={handleClear} className="p-1 rounded-md hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {showCurrentLocation && (
            <button
              onClick={handleCurrentLocation}
              disabled={geoLoading}
              className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
              title="Use current location"
            >
              {geoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (suggestions.length > 0 || loading) && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching places...
            </div>
          ) : (
            <ul className="py-1 max-h-64 overflow-y-auto">
              {suggestions.map((place) => (
                <li key={place.placeId}>
                  <button
                    onClick={() => handleSelect(place)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{place.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[place.city, place.state, place.country]
                          .filter(Boolean)
                          .filter((v, i, arr) => arr.indexOf(v) === i)
                          .join(", ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
