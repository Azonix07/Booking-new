"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Navigation,
  MapPin,
  Wrench,
  CheckCircle,
  Phone,
  Clock,
  AlertTriangle,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  joinTrackingRoom,
  leaveTrackingRoom,
  getTrackingSocket,
  sendLocationUpdate,
  sendStatusUpdate,
  sendEtaUpdate,
} from "@/lib/tracking-socket";
import type { ServiceRequestData, ServiceRequestStatus } from "@/lib/types";

const STATUS_ACTIONS: {
  fromStatus: ServiceRequestStatus;
  toStatus: ServiceRequestStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { fromStatus: "accepted", toStatus: "on_the_way", label: "Start Journey", icon: Navigation, color: "bg-indigo-600 hover:bg-indigo-700" },
  { fromStatus: "on_the_way", toStatus: "arrived", label: "I've Arrived", icon: MapPin, color: "bg-purple-600 hover:bg-purple-700" },
  { fromStatus: "arrived", toStatus: "working", label: "Start Work", icon: Wrench, color: "bg-amber-600 hover:bg-amber-700" },
  { fromStatus: "working", toStatus: "completed", label: "Complete Job", icon: CheckCircle, color: "bg-emerald-600 hover:bg-emerald-700" },
];

interface ProviderTrackingProps {
  requestId: string;
  onComplete?: () => void;
}

export function ProviderTracking({ requestId, onComplete }: ProviderTrackingProps) {
  const [request, setRequest] = useState<ServiceRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // Load request data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<ServiceRequestData>(`/service-requests/${requestId}`);
        setRequest(data);
      } catch (err) {
        console.error("Failed to load request", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [requestId]);

  // Join WebSocket room
  useEffect(() => {
    joinTrackingRoom(requestId);
    return () => leaveTrackingRoom(requestId);
  }, [requestId]);

  // Start location sharing
  const startLocationSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    setIsSharing(true);
    setLocationError(null);

    // Watch position for real-time updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPosRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
      },
      (err) => {
        setLocationError(`Location error: ${err.message}`);
        setIsSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    // Send updates every 5 seconds
    intervalRef.current = setInterval(() => {
      if (lastPosRef.current) {
        sendLocationUpdate({
          requestId,
          latitude: lastPosRef.current.lat,
          longitude: lastPosRef.current.lng,
        });
      }
    }, 5000);
  }, [requestId]);

  // Stop location sharing
  const stopLocationSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSharing(false);
  }, []);

  // Auto-start sharing when status is on_the_way
  useEffect(() => {
    if (request?.status === "on_the_way" && !isSharing) {
      startLocationSharing();
    }
    if (request?.status === "completed" || request?.status === "cancelled") {
      stopLocationSharing();
    }
  }, [request?.status, isSharing, startLocationSharing, stopLocationSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationSharing();
    };
  }, [stopLocationSharing]);

  // Handle status transition
  const handleStatusUpdate = async (newStatus: ServiceRequestStatus) => {
    if (!request) return;
    setUpdating(true);
    try {
      await api.patch("/service-requests/status", {
        requestId,
        status: newStatus,
      });
      setRequest((prev) => (prev ? { ...prev, status: newStatus } : prev));
      sendStatusUpdate(requestId, newStatus);

      if (newStatus === "on_the_way") {
        startLocationSharing();
      }
      if (newStatus === "completed") {
        stopLocationSharing();
        onComplete?.();
      }
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setUpdating(false);
    }
  };

  // Compute ETA based on distance (rough estimate)
  useEffect(() => {
    if (!request || !lastPosRef.current) return;
    if (request.status !== "on_the_way") return;

    const interval = setInterval(() => {
      if (!lastPosRef.current) return;
      const custLat = request.customerLocation.coordinates[1];
      const custLng = request.customerLocation.coordinates[0];
      const provLat = lastPosRef.current.lat;
      const provLng = lastPosRef.current.lng;

      // Haversine distance
      const R = 6371;
      const dLat = ((custLat - provLat) * Math.PI) / 180;
      const dLon = ((custLng - provLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((provLat * Math.PI) / 180) *
          Math.cos((custLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;
      const etaMin = Math.max(1, Math.round((distKm / 30) * 60)); // ~30 km/h avg

      sendEtaUpdate(requestId, etaMin, Math.round(distKm * 10) / 10);
    }, 15000); // Update ETA every 15 seconds

    return () => clearInterval(interval);
  }, [request, requestId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Request not found</p>
      </div>
    );
  }

  const nextAction = STATUS_ACTIONS.find((a) => a.fromStatus === request.status);
  const customer = request.customerId;
  const isCompleted = request.status === "completed";

  return (
    <div className="space-y-4">
      {/* Request header */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
              {request.requestRef}
            </p>
            <h3 className="font-bold text-lg">{request.title}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {request.category.replace(/_/g, " ")}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              isCompleted
                ? "bg-emerald-100 text-emerald-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {request.status.replace(/_/g, " ")}
          </div>
        </div>

        {request.description && (
          <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
        )}

        {/* Customer info */}
        {customer && typeof customer === "object" && (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{request.customerAddress}</p>
              </div>
            </div>
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="p-2 rounded-full bg-emerald-100 text-emerald-600"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Location sharing status */}
      {isSharing && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-600" />
          </span>
          <span className="text-sm text-indigo-700 font-medium">Sharing live location</span>
        </div>
      )}

      {locationError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">{locationError}</span>
        </div>
      )}

      {/* Estimated amount */}
      {request.estimatedAmount > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border px-4 py-3">
          <span className="text-sm text-muted-foreground">Estimated amount</span>
          <span className="font-bold text-lg">₹{request.estimatedAmount.toLocaleString("en-IN")}</span>
        </div>
      )}

      {/* Action button */}
      {nextAction && !isCompleted && (
        <Button
          onClick={() => handleStatusUpdate(nextAction.toStatus)}
          disabled={updating}
          className={`w-full h-14 text-base font-bold rounded-xl text-white ${nextAction.color}`}
          size="lg"
        >
          {updating ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <nextAction.icon className="h-5 w-5 mr-2" />
          )}
          {nextAction.label}
        </Button>
      )}

      {isCompleted && (
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-emerald-700">Job Completed!</p>
          {request.finalAmount > 0 && (
            <p className="text-sm text-emerald-600 mt-1">
              Final amount: ₹{request.finalAmount.toLocaleString("en-IN")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
