"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Phone,
  MessageCircle,
  Navigation,
  Clock,
  CheckCircle,
  Truck,
  Wrench,
  MapPin,
  Star,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  joinTrackingRoom,
  leaveTrackingRoom,
  getTrackingSocket,
  disconnectTrackingSocket,
} from "@/lib/tracking-socket";
import type {
  ServiceRequestData,
  TrackingSessionData,
  LiveLocation,
  ServiceRequestStatus,
} from "@/lib/types";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_STEPS: {
  key: ServiceRequestStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "pending", label: "Request Sent", icon: Clock, color: "text-gray-400" },
  { key: "accepted", label: "Accepted", icon: CheckCircle, color: "text-blue-500" },
  { key: "on_the_way", label: "On the Way", icon: Truck, color: "text-indigo-500" },
  { key: "arrived", label: "Arrived", icon: MapPin, color: "text-purple-500" },
  { key: "working", label: "Work in Progress", icon: Wrench, color: "text-amber-500" },
  { key: "completed", label: "Completed", icon: Star, color: "text-emerald-500" },
];

function getStatusIndex(status: ServiceRequestStatus): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

// ─── Map component (Mapbox GL) ─────────────────────────────────────────────────

function TrackingMap({
  customerLocation,
  providerLocation,
  locationHistory,
}: {
  customerLocation: [number, number]; // [lng, lat]
  providerLocation: [number, number] | null;
  locationHistory: { lat: number; lng: number }[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const providerMarker = useRef<any>(null);
  const animationFrame = useRef<number>(0);
  const currentPos = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Dynamically load Mapbox GL
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
    script.onload = () => {
      const mapboxgl = (window as any).mapboxgl;
      if (!mapboxgl) return;

      mapboxgl.accessToken =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: customerLocation,
        zoom: 14,
      });

      // Customer marker (fixed pin)
      const customerEl = document.createElement("div");
      customerEl.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`;
      new mapboxgl.Marker({ element: customerEl })
        .setLngLat(customerLocation)
        .addTo(map);

      mapInstance.current = map;

      map.on("load", () => {
        // Add route source
        map.addSource("route", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#6366f1", "line-width": 4, "line-opacity": 0.8 },
        });
      });
    };
    document.head.appendChild(script);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [customerLocation]);

  // Smooth marker interpolation for provider location
  useEffect(() => {
    if (!providerLocation || !mapInstance.current) return;
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    const map = mapInstance.current;

    if (!providerMarker.current) {
      const el = document.createElement("div");
      el.innerHTML = `<div class="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center animate-pulse"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>`;
      providerMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat(providerLocation)
        .addTo(map);
      currentPos.current = providerLocation;
    } else {
      // Smooth interpolation
      const start = currentPos.current || providerLocation;
      const end = providerLocation;
      const duration = 1000; // 1 second
      const startTime = performance.now();

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);

        const lng = start[0] + (end[0] - start[0]) * ease;
        const lat = start[1] + (end[1] - start[1]) * ease;

        providerMarker.current?.setLngLat([lng, lat]);

        if (t < 1) {
          animationFrame.current = requestAnimationFrame(animate);
        } else {
          currentPos.current = end;
        }
      };

      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(animate);
    }

    // Update route line from location history
    if (locationHistory.length > 1 && map.getSource("route")) {
      const coords = locationHistory.map((p) => [p.lng, p.lat]);
      coords.push([providerLocation[0], providerLocation[1]]);
      map.getSource("route").setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: {},
      });
    }

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend(customerLocation);
    bounds.extend(providerLocation);
    map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 500 });
  }, [providerLocation, customerLocation, locationHistory]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface TrackingScreenProps {
  requestId: string;
  onClose?: () => void;
}

export function TrackingScreen({ requestId, onClose }: TrackingScreenProps) {
  const [request, setRequest] = useState<ServiceRequestData | null>(null);
  const [tracking, setTracking] = useState<TrackingSessionData | null>(null);
  const [providerLoc, setProviderLoc] = useState<LiveLocation | null>(null);
  const [eta, setEta] = useState<{ minutes: number; distanceKm: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [rated, setRated] = useState(false);

  // Initial data fetch
  useEffect(() => {
    const load = async () => {
      try {
        const reqData = await api.get<ServiceRequestData>(`/service-requests/${requestId}`);
        setRequest(reqData);

        const trackData = await api.get<{ tracking: TrackingSessionData; liveLocation: LiveLocation }>(
          `/service-requests/${requestId}/tracking`,
        );
        if (trackData.tracking) setTracking(trackData.tracking);
        if (trackData.liveLocation) setProviderLoc(trackData.liveLocation);
      } catch (err) {
        console.error("Failed to load tracking data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [requestId]);

  // WebSocket connection
  useEffect(() => {
    joinTrackingRoom(requestId);

    const socket = getTrackingSocket();

    socket.on("tracking-state", (data: any) => {
      if (data.tracking) setTracking(data.tracking);
      if (data.liveLocation) setProviderLoc(data.liveLocation);
    });

    socket.on("provider-location", (data: LiveLocation & { requestId: string }) => {
      if (data.requestId === requestId) {
        setProviderLoc(data);
      }
    });

    socket.on("status-changed", (data: { requestId: string; status: ServiceRequestStatus }) => {
      if (data.requestId === requestId) {
        setRequest((prev) => prev ? { ...prev, status: data.status } : prev);
      }
    });

    socket.on("eta-changed", (data: { requestId: string; etaMinutes: number; distanceKm: number }) => {
      if (data.requestId === requestId) {
        setEta({ minutes: data.etaMinutes, distanceKm: data.distanceKm });
      }
    });

    socket.on("tracking-ended", () => {
      setRequest((prev) => prev ? { ...prev, status: "completed" } : prev);
    });

    return () => {
      leaveTrackingRoom(requestId);
      socket.off("tracking-state");
      socket.off("provider-location");
      socket.off("status-changed");
      socket.off("eta-changed");
      socket.off("tracking-ended");
    };
  }, [requestId]);

  const handleRate = useCallback(async () => {
    if (rating === 0) return;
    try {
      await api.patch("/service-requests/rate", {
        requestId,
        rating,
        review,
      });
      setRated(true);
    } catch (err) {
      console.error("Rating failed", err);
    }
  }, [requestId, rating, review]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Request not found</h2>
        <p className="text-sm text-muted-foreground mt-1">This service request may have been cancelled.</p>
      </div>
    );
  }

  const currentStatusIdx = getStatusIndex(request.status);
  const customerCoords: [number, number] = [
    request.customerLocation.coordinates[0],
    request.customerLocation.coordinates[1],
  ];
  const providerCoords: [number, number] | null = providerLoc
    ? [providerLoc.longitude, providerLoc.latitude]
    : request.providerLocation?.coordinates?.[0]
      ? [request.providerLocation.coordinates[0], request.providerLocation.coordinates[1]]
      : null;
  const history = tracking?.locationHistory || [];

  const isCompleted = request.status === "completed";
  const provider = request.providerId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white/95 backdrop-blur-sm">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {request.requestRef}
          </p>
          <h2 className="text-lg font-bold">{request.title}</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-[250px]">
        {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
          <TrackingMap
            customerLocation={customerCoords}
            providerLocation={providerCoords}
            locationHistory={history}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Navigation className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Map unavailable</p>
              <p className="text-xs">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable</p>
              {providerLoc && (
                <p className="text-xs mt-2 text-indigo-600">
                  Provider at: {providerLoc.latitude.toFixed(4)}, {providerLoc.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ETA overlay */}
        {eta && !isCompleted && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-xl shadow-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-sm font-bold">{Math.round(eta.minutes)} min</p>
                <p className="text-[10px] text-muted-foreground">
                  {eta.distanceKm.toFixed(1)} km away
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div className="bg-white border-t rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center py-2"
        >
          {expanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
        </button>

        {expanded && (
          <div className="px-4 pb-5 space-y-4">
            {/* Provider info */}
            {provider && typeof provider === "object" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {provider.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {request.category.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone}`}
                      className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  <button className="p-2.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Status timeline */}
            <div className="space-y-1">
              {STATUS_STEPS.filter((s) => s.key !== "cancelled").map((step, i) => {
                const isActive = i === currentStatusIdx;
                const isDone = i < currentStatusIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isActive
                              ? "bg-indigo-500 text-white ring-4 ring-indigo-100"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {i < STATUS_STEPS.length - 2 && (
                        <div className={`w-0.5 h-4 ${isDone ? "bg-emerald-400" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isDone ? "text-emerald-600" : isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                      {isActive && (
                        <span className="ml-2 text-xs text-indigo-500 animate-pulse">● Active</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rating section (after completion) */}
            {isCompleted && !rated && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-sm">Rate your experience</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)}>
                      <Star
                        className={`h-7 w-7 transition-all ${
                          n <= rating
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "text-gray-300 hover:text-amber-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Leave a review (optional)"
                  className="w-full text-sm border rounded-lg p-2 resize-none h-16"
                />
                <Button
                  onClick={handleRate}
                  disabled={rating === 0}
                  size="sm"
                  className="w-full rounded-lg"
                >
                  Submit Rating
                </Button>
              </div>
            )}

            {rated && (
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-sm font-medium text-emerald-700">Thank you for your rating!</p>
              </div>
            )}

            {/* Amount */}
            {(request.estimatedAmount > 0 || request.finalAmount > 0) && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {isCompleted ? "Final amount" : "Estimated amount"}
                </span>
                <span className="font-bold">
                  ₹{(isCompleted ? request.finalAmount : request.estimatedAmount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
