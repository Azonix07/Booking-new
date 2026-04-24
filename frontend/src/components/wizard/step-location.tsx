"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationSearch, type PlaceSuggestion } from "@/components/location-search";
import { api } from "@/lib/api";
import {
  MapPin,
  Link2,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface LocationData {
  address: {
    street?: string;
    city: string;
    state: string;
    zip?: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  gmapUrl?: string;
}

interface StepLocationProps {
  data: LocationData | null;
  onSave: (data: LocationData) => Promise<void>;
  saving: boolean;
}

export default function StepLocation({ data, onSave, saving }: StepLocationProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(
    data?.address
      ? {
          placeId: "",
          displayName: [data.address.city, data.address.state, data.address.country].filter(Boolean).join(", "),
          city: data.address.city,
          state: data.address.state,
          country: data.address.country,
          latitude: data.coordinates?.latitude ?? 0,
          longitude: data.coordinates?.longitude ?? 0,
          type: "saved",
        }
      : null
  );
  const [street, setStreet] = useState(data?.address?.street || "");
  const [zip, setZip] = useState(data?.address?.zip || "");
  const [gmapUrl, setGmapUrl] = useState(data?.gmapUrl || "");
  const [gmapParsing, setGmapParsing] = useState(false);
  const [gmapError, setGmapError] = useState("");

  const handlePlaceSelect = (place: PlaceSuggestion) => {
    setSelectedPlace(place);
    setGmapError("");
  };

  const handleGmapPaste = async () => {
    if (!gmapUrl.trim()) return;
    setGmapParsing(true);
    setGmapError("");
    try {
      const result = await api.post<{
        coordinates: { latitude: number; longitude: number };
        address: PlaceSuggestion | null;
        placeName?: string;
      }>("/location/parse-gmap", { url: gmapUrl.trim() });

      if (!result?.coordinates) {
        setGmapError("We couldn't read that link. Try copying the URL again from Google Maps.");
        return;
      }

      if (result.address) {
        setSelectedPlace({
          ...result.address,
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
        });
      } else {
        setSelectedPlace({
          placeId: "",
          displayName: result.placeName || `${result.coordinates.latitude.toFixed(4)}, ${result.coordinates.longitude.toFixed(4)}`,
          city: "",
          state: "",
          country: "",
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
          type: "gmap",
        });
      }
    } catch {
      setGmapError("Couldn't reach the location service. Please try searching above instead.");
    } finally {
      setGmapParsing(false);
    }
  };

  const handleSave = () => {
    if (!selectedPlace) return;
    onSave({
      address: {
        street: street.trim() || undefined,
        city: selectedPlace.city || selectedPlace.displayName.split(",")[0]?.trim() || "",
        state: selectedPlace.state || "",
        zip: zip.trim() || undefined,
        country: selectedPlace.country || "India",
      },
      coordinates: {
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      },
      gmapUrl: gmapUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Where are you located?</h2>
        <p className="text-muted-foreground mt-1.5">
          Customers will use this to find you. Search below or paste a Google Maps link.
        </p>
      </div>

      {/* Method 1: Search by place */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">1</div>
          Search for your place
        </div>
        <LocationSearch
          value={selectedPlace}
          onSelect={handlePlaceSelect}
          placeholder="Type your business name, area, or landmark..."
          size="lg"
          showCurrentLocation
        />
        <p className="text-xs text-muted-foreground pl-8">
          Tip: Business name works best. Try &quot;Blue Tokai, Bandra&quot; or &quot;Cyber Hub, Gurgaon&quot;.
        </p>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">or</span>
        </div>
      </div>

      {/* Method 2: Paste Google Maps link */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">2</div>
          Paste a Google Maps link
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={gmapUrl}
            onChange={(e) => { setGmapUrl(e.target.value); setGmapError(""); }}
            placeholder="https://maps.google.com/..."
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && gmapUrl.trim()) handleGmapPaste(); }}
          />
          <Button
            onClick={handleGmapPaste}
            disabled={!gmapUrl.trim() || gmapParsing}
            variant="outline"
            className="shrink-0 gap-1.5"
          >
            {gmapParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            {gmapParsing ? "Finding..." : "Use this link"}
          </Button>
        </div>
        {gmapError ? (
          <p className="text-xs text-destructive flex items-center gap-1.5 pl-8">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {gmapError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground pl-8">
            Open Google Maps → find your place → copy the URL from the address bar.
          </p>
        )}
      </div>

      {/* Location preview */}
      {selectedPlace && (
        <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-primary uppercase tracking-wide">Location set</p>
              <p className="font-semibold truncate">{selectedPlace.displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-primary/10">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                Street address
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-normal">Optional</span>
              </label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="123 MG Road, Near Metro"
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                ZIP / PIN code
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-normal">Optional</span>
              </label>
              <Input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="560001"
                className="bg-background"
              />
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!selectedPlace || saving}
        size="lg"
        className="w-full rounded-xl gap-1.5 shadow-md shadow-primary/20 hover:shadow-primary/30"
      >
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
        ) : (
          <>Continue <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>
    </div>
  );
}
