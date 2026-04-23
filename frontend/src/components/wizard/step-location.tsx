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
  CheckCircle,
  AlertCircle,
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
        setGmapError("Could not parse this Google Maps link. Try a different URL format.");
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
      setGmapError("Failed to parse Google Maps URL. Please check the link.");
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Business Location</h2>
        <p className="text-muted-foreground mt-1">
          Set your business location so customers can find you. Search by place name or paste a Google Maps link.
        </p>
      </div>

      {/* Method 1: Search by place */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Search your location
        </div>
        <LocationSearch
          value={selectedPlace}
          onSelect={handlePlaceSelect}
          placeholder="Type your city, area, or landmark..."
          size="lg"
          showCurrentLocation
        />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-medium">or</span>
        </div>
      </div>

      {/* Method 2: Paste Google Maps link */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Link2 className="h-4 w-4 text-primary" />
          Paste Google Maps link
        </div>
        <div className="flex gap-2">
          <Input
            value={gmapUrl}
            onChange={(e) => { setGmapUrl(e.target.value); setGmapError(""); }}
            placeholder="https://maps.google.com/..."
            className="flex-1"
          />
          <Button
            onClick={handleGmapPaste}
            disabled={!gmapUrl.trim() || gmapParsing}
            variant="outline"
            className="shrink-0"
          >
            {gmapParsing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Navigation className="h-4 w-4 mr-1.5" />}
            {gmapParsing ? "Parsing..." : "Fetch Location"}
          </Button>
        </div>
        {gmapError && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {gmapError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Open Google Maps → Find your business → Copy the URL from the address bar and paste it here.
        </p>
      </div>

      {/* Location preview */}
      {selectedPlace && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{selectedPlace.displayName}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Coordinates: {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Optional street address and zip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-primary/10">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Street Address (optional)
              </label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g., 123 MG Road"
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                ZIP / PIN Code (optional)
              </label>
              <Input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="e.g., 680664"
                className="bg-background"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={!selectedPlace || saving}
        className="w-full rounded-xl h-12 bg-primary border-0 text-white"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          <>
            Continue
            <MapPin className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}
