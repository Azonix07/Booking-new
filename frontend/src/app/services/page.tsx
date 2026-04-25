"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Wrench,
  Droplets,
  Hammer,
  Paintbrush,
  Wind,
  Sparkles,
  Settings,
  ChevronRight,
  MapPin,
  Clock,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { TrackingScreen } from "@/components/tracking/tracking-screen";
import type { ServiceRequestData, OnDemandCategory } from "@/lib/types";

const CATEGORIES: {
  key: OnDemandCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}[] = [
  { key: "electrician", label: "Electrician", icon: Zap, color: "from-amber-500 to-orange-600", description: "Wiring, switches, repairs" },
  { key: "plumber", label: "Plumber", icon: Droplets, color: "from-blue-500 to-cyan-600", description: "Pipes, taps, drainage" },
  { key: "carpenter", label: "Carpenter", icon: Hammer, color: "from-amber-600 to-yellow-700", description: "Furniture, fittings, woodwork" },
  { key: "welder", label: "Welder", icon: Wrench, color: "from-gray-500 to-zinc-700", description: "Metal fabrication & repair" },
  { key: "painter", label: "Painter", icon: Paintbrush, color: "from-purple-500 to-pink-600", description: "Interior & exterior painting" },
  { key: "ac_repair", label: "AC Repair", icon: Wind, color: "from-sky-500 to-blue-600", description: "AC service & maintenance" },
  { key: "cleaning", label: "Cleaning", icon: Sparkles, color: "from-emerald-500 to-teal-600", description: "Deep clean, sanitization" },
  { key: "appliance_repair", label: "Appliance Repair", icon: Settings, color: "from-indigo-500 to-violet-600", description: "TV, fridge, washing machine" },
];

type Step = "category" | "details" | "confirm" | "tracking";

export default function ServiceRequestPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<OnDemandCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<ServiceRequestData | null>(null);
  const [myRequests, setMyRequests] = useState<ServiceRequestData[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load existing requests
  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<ServiceRequestData[]>("/service-requests/my-requests")
      .then((data) => {
        setMyRequests(data || []);
        // Auto-resume tracking for active request
        const active = (data || []).find(
          (r) => !["completed", "cancelled", "pending"].includes(r.status),
        );
        if (active) {
          setActiveRequest(active);
          setStep("tracking");
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleSelectCategory = (cat: OnDemandCategory) => {
    setCategory(cat);
    const catData = CATEGORIES.find((c) => c.key === cat);
    setTitle(`${catData?.label || cat} service needed`);
    setStep("details");
    detectLocation();
  };

  const handleSubmit = async () => {
    if (!category || !coords || !address) return;
    setSubmitting(true);
    try {
      const data = await api.post<ServiceRequestData>("/service-requests", {
        category,
        title,
        description,
        latitude: coords.lat,
        longitude: coords.lng,
        address,
      });
      setActiveRequest(data);
      setStep("tracking");
    } catch (err) {
      console.error("Failed to create request", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Full-screen tracking mode
  if (step === "tracking" && activeRequest) {
    return (
      <div className="h-screen flex flex-col">
        <TrackingScreen
          requestId={activeRequest._id}
          onClose={() => {
            setStep("category");
            setActiveRequest(null);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50/50 pt-20">
        <div className="mx-auto max-w-lg px-4 py-8">
          {/* Back button */}
          {step !== "category" && (
            <button
              onClick={() => setStep(step === "confirm" ? "details" : "category")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}

          {/* Step: Category selection */}
          {step === "category" && (
            <div>
              <h1 className="text-2xl font-bold mb-1">Need help?</h1>
              <p className="text-muted-foreground mb-6">
                Choose a service and we&apos;ll connect you with a nearby professional
              </p>

              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleSelectCategory(cat.key)}
                      className="group relative bg-white border border-border/60 rounded-2xl p-4 text-left hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                      <div
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-md mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-sm">{cat.label}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cat.description}</p>
                      <ChevronRight className="absolute top-4 right-3 h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                    </button>
                  );
                })}
              </div>

              {/* Recent requests */}
              {myRequests.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3">Recent requests</h2>
                  <div className="space-y-2">
                    {myRequests.slice(0, 5).map((req) => (
                      <button
                        key={req._id}
                        onClick={() => {
                          if (!["completed", "cancelled"].includes(req.status)) {
                            setActiveRequest(req);
                            setStep("tracking");
                          }
                        }}
                        className="w-full flex items-center justify-between bg-white border rounded-xl px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="text-left">
                          <p className="text-sm font-semibold">{req.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {req.requestRef} · {req.status.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : req.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {req.status.replace(/_/g, " ")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Details */}
          {step === "details" && category && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Describe the issue</h1>
              <p className="text-muted-foreground text-sm">
                Help us understand what you need
              </p>

              <div>
                <label className="text-sm font-medium block mb-1.5">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Details (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm resize-none h-24"
                  placeholder="Describe the problem in detail..."
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Your address</label>
                <div className="relative">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-sm pr-24"
                    placeholder="Enter your full address"
                  />
                  <button
                    onClick={detectLocation}
                    disabled={locating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                  >
                    {locating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    Locate me
                  </button>
                </div>
                {coords && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Location detected
                  </p>
                )}
              </div>

              <Button
                onClick={() => setStep("confirm")}
                disabled={!title || !address || !coords}
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && category && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Confirm request</h1>

              <div className="bg-white border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${CATEGORIES.find((c) => c.key === category)?.color} text-white flex items-center justify-center`}>
                    {(() => {
                      const Icon = CATEGORIES.find((c) => c.key === category)?.icon || Wrench;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{category.replace(/_/g, " ")}</p>
                  </div>
                </div>

                {description && (
                  <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">{description}</p>
                )}

                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{address}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>A provider will be matched shortly</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Send Request
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
