"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  ChevronRight,
  Loader2,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ProviderTracking } from "@/components/tracking/provider-tracking";
import type { ServiceRequestData, ServiceRequestStatus } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  on_the_way: "bg-indigo-100 text-indigo-700",
  arrived: "bg-purple-100 text-purple-700",
  working: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ServiceRequestsDashboard() {
  const [pendingRequests, setPendingRequests] = useState<ServiceRequestData[]>([]);
  const [myRequests, setMyRequests] = useState<ServiceRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "active" | "history">("pending");
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, mine] = await Promise.all([
        api.get<ServiceRequestData[]>("/service-requests/pending"),
        api.get<ServiceRequestData[]>("/service-requests/provider-requests"),
      ]);
      setPendingRequests(pending || []);
      setMyRequests(mine || []);

      // Auto-open active tracking
      const active = (mine || []).find(
        (r) => !["completed", "cancelled", "pending"].includes(r.status),
      );
      if (active && !activeTrackingId) {
        setActiveTrackingId(active._id);
        setTab("active");
      }
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setLoading(false);
    }
  }, [activeTrackingId]);

  useEffect(() => {
    loadData();
    // Poll for new requests every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAccept = async (requestId: string) => {
    if (!navigator.geolocation) return;
    setAccepting(requestId);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await api.post("/service-requests/accept", {
        requestId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      setActiveTrackingId(requestId);
      setTab("active");
      loadData();
    } catch (err) {
      console.error("Failed to accept", err);
    } finally {
      setAccepting(null);
    }
  };

  // Show active tracking panel
  if (activeTrackingId && tab === "active") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Active Job</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTrackingId(null);
              setTab("pending");
            }}
          >
            Back to list
          </Button>
        </div>
        <ProviderTracking
          requestId={activeTrackingId}
          onComplete={() => {
            setActiveTrackingId(null);
            setTab("pending");
            loadData();
          }}
        />
      </div>
    );
  }

  const activeRequests = myRequests.filter(
    (r) => !["completed", "cancelled"].includes(r.status),
  );
  const historyRequests = myRequests.filter(
    (r) => ["completed", "cancelled"].includes(r.status),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Service Requests</h1>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(
          [
            { key: "pending", label: "Incoming", count: pendingRequests.length },
            { key: "active", label: "Active", count: activeRequests.length },
            { key: "history", label: "History", count: historyRequests.length },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  tab === t.key ? "bg-primary text-white" : "bg-gray-200"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <>
          {/* Pending tab */}
          {tab === "pending" && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <EmptyState message="No incoming requests" />
              ) : (
                pendingRequests.map((req) => (
                  <RequestCard
                    key={req._id}
                    request={req}
                    action={
                      <Button
                        size="sm"
                        onClick={() => handleAccept(req._id)}
                        disabled={accepting === req._id}
                        className="rounded-lg"
                      >
                        {accepting === req._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Accept"
                        )}
                      </Button>
                    }
                  />
                ))
              )}
            </div>
          )}

          {/* Active tab */}
          {tab === "active" && (
            <div className="space-y-3">
              {activeRequests.length === 0 ? (
                <EmptyState message="No active jobs" />
              ) : (
                activeRequests.map((req) => (
                  <RequestCard
                    key={req._id}
                    request={req}
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveTrackingId(req._id);
                        }}
                        className="rounded-lg"
                      >
                        Track <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    }
                  />
                ))
              )}
            </div>
          )}

          {/* History tab */}
          {tab === "history" && (
            <div className="space-y-3">
              {historyRequests.length === 0 ? (
                <EmptyState message="No past requests" />
              ) : (
                historyRequests.map((req) => (
                  <RequestCard key={req._id} request={req} />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RequestCard({
  request,
  action,
}: {
  request: ServiceRequestData;
  action?: React.ReactNode;
}) {
  const customer = request.customerId;
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {request.requestRef}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                STATUS_COLORS[request.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {request.status.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="font-bold text-sm truncate">{request.title}</h3>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {request.category.replace(/_/g, " ")}
          </p>
        </div>
        {action}
      </div>

      {/* Customer & address */}
      <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
        {customer && typeof customer === "object" && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{customer.name}</span>
            </p>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="text-xs text-blue-600 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Call
              </a>
            )}
          </div>
        )}
        {request.customerAddress && (
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            {request.customerAddress}
          </p>
        )}
        {request.estimatedAmount > 0 && (
          <p className="text-xs font-semibold">
            ₹{request.estimatedAmount.toLocaleString("en-IN")}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
