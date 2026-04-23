"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Check } from "lucide-react";

import StepBusinessType from "@/components/wizard/step-business-type";
import StepLocation from "@/components/wizard/step-location";
import StepBusinessHours from "@/components/wizard/step-business-hours";
import StepServices from "@/components/wizard/step-services";
import StepSlotConfig from "@/components/wizard/step-slot-config";
import StepPricing from "@/components/wizard/step-pricing";
import StepPaymentMethod from "@/components/wizard/step-payment-method";
import StepCustomerFields from "@/components/wizard/step-customer-fields";
import StepReview from "@/components/wizard/step-review";

const STEPS = [
  { id: 1, label: "Business Type", key: "business_type" },
  { id: 2, label: "Location", key: "location" },
  { id: 3, label: "Business Hours", key: "business_hours" },
  { id: 4, label: "Services", key: "services" },
  { id: 5, label: "Slot Config", key: "slot_config" },
  { id: 6, label: "Pricing", key: "pricing" },
  { id: 7, label: "Payment", key: "payment_method" },
  { id: 8, label: "Customer Info", key: "customer_fields" },
  { id: 9, label: "Review", key: "review_create" },
];

export interface WizardData {
  businessType: { category: string; customCategory?: string } | null;
  location: { address: { street?: string; city: string; state: string; zip?: string; country: string }; coordinates: { latitude: number; longitude: number }; gmapUrl?: string } | null;
  businessHours: { sameForAllDays: boolean; hours: any[] } | null;
  services: any[];
  slotConfig: { slotDurationMinutes: number; minBookingNoticeHours?: number; maxAdvanceBookingDays?: number; bufferBetweenSlotsMinutes?: number; allowWalkIns: boolean } | null;
  pricing: any[];
  paymentMethod: { acceptOnlinePayment: boolean; acceptPayAtShop: boolean; showPriceBeforeBooking: boolean } | null;
  customerFields: { nameRequired: boolean; phoneRequired: boolean; emailRequired: boolean; customFields: any[] } | null;
}

export default function SetupWizardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    businessType: null,
    location: null,
    businessHours: null,
    services: [],
    slotConfig: null,
    pricing: [],
    paymentMethod: null,
    customerFields: null,
  });

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "client_admin") { router.push("/"); return; }
    // Setup already completed — route based on subscription + tenant status
    const ob = user?.onboarding;
    if (ob?.setupCompleted) {
      if (!ob.subscription || ob.subscription.status === "rejected") {
        router.push("/list-your-business#plans");
      } else if (ob.subscription.status === "pending") {
        router.push("/list-your-business/pending");
      } else if (ob.subscription.status === "active" && ob.tenantStatus === "active") {
        router.push("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load saved progress
  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== "client_admin") return;
    async function load() {
      try {
        const res = await api.get<any>("/setup-wizard");
        if (res) {
          if (res.status === "completed") {
            router.push("/dashboard");
            return;
          }
          setCurrentStep(res.currentStepNumber || 1);
          setCompletedSteps(res.completedSteps || []);
          setWizardData({
            businessType: res.data?.businessType || null,
            location: res.data?.location || null,
            businessHours: res.data?.businessHours || null,
            services: res.data?.services || [],
            slotConfig: res.data?.slotConfig || null,
            pricing: res.data?.pricing || [],
            paymentMethod: res.data?.paymentMethod || null,
            customerFields: res.data?.customerFields || null,
          });
        }
      } catch {
        // First time — start fresh
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading, isAuthenticated, user, router]);

  const goToStep = (step: number) => {
    setError(null);
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < 9) goToStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const saveStep = async (endpoint: string, data: any) => {
    setSaving(true);
    setError(null);
    try {
      await api.put(endpoint, data);
      const stepKey = STEPS[currentStep - 1].key;
      if (!completedSteps.includes(stepKey)) {
        setCompletedSteps((prev) => [...prev, stepKey]);
      }
      return true;
    } catch (err: any) {
      const msg = err?.message || "Failed to save. Please try again.";
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/setup-wizard/finalize", {});
      // Refresh user state to get updated onboarding status
      await refreshUser();
      // Route based on whether the subscription is active (free plan) or pending approval
      const ob = user?.onboarding;
      if (ob?.subscription?.status === "active" && ob.tenantStatus === "active") {
        router.push("/dashboard");
      } else {
        router.push("/list-your-business/pending");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to finalize setup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/5">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold">Setup Your Business</h1>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.key);
              const isCurrent = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className="flex-1 group"
                >
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isCompleted
                        ? "bg-primary"
                        : isCurrent
                          ? "bg-primary/50"
                          : "bg-muted-foreground/15"
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1.5 block text-center transition-colors ${
                      isCurrent
                        ? "text-primary font-semibold"
                        : isCompleted
                          ? "text-primary/70 font-medium"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-red-700"
          >
            <span className="mt-0.5 text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Something went wrong</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
          </motion.div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {currentStep === 1 && (
              <StepBusinessType
                data={wizardData.businessType}
                onSave={async (data) => {
                  setWizardData((prev) => ({ ...prev, businessType: data }));
                  const ok = await saveStep("/setup-wizard/step/business-type", data);
                  if (ok) nextStep();
                }}
                saving={saving}
              />
            )}
            {currentStep === 2 && (
              <StepLocation
                data={wizardData.location}
                onSave={async (data) => {
                  setWizardData((prev) => ({ ...prev, location: data }));
                  const ok = await saveStep("/setup-wizard/step/location", data);
                  if (ok) nextStep();
                }}
                saving={saving}
              />
            )}
            {currentStep === 3 && (
              <StepBusinessHours
                data={wizardData.businessHours}
                onSave={async (data) => {
                  setWizardData((prev) => ({ ...prev, businessHours: data }));
                  const ok = await saveStep("/setup-wizard/step/business-hours", data);
                  if (ok) nextStep();
                }}
                saving={saving}
              />
            )}
            {currentStep === 4 && (
              <StepServices
                data={wizardData.services}
                businessType={wizardData.businessType?.category || ""}
                onSave={async (data) => {
                  setWizardData((prev) => ({ ...prev, services: data }));
                  const ok = await saveStep("/setup-wizard/step/services", { services: data });
                  if (ok) nextStep();
                }}
                saving={saving}
              />
            )}
            {currentStep === 5 && (
              <StepSlotConfig
                data={wizardData.slotConfig}
                onSave={async (data) => {
                  setWizardData((prev) => ({ ...prev, slotConfig: data }));
                  const ok = await saveStep("/setup-wizard/step/slot-config", data);
                  if (ok) nextStep();
                }}
                saving={saving}
              />
            )}
            {currentStep === 6 && (
              <StepPricing
                data={wizardData.pricing}
                services={wizardData.services}
                onSave={async (data) => {
                  setWizardData((prev) => ({ ...prev, pricing: data }));
                  // Strip frontend-only fields before sending to backend
                  const backendPricing = data.map((p: any) => ({
                    serviceName: p.serviceName,
                    basePrice: p.basePrice,
                    pricePerAdditionalPerson: p.pricePerAdditionalPerson,
                    currency: p.currency,
                    durationOptions: p.durationOptions,
                  }));
                  const ok = await saveStep("/setup-wizard/step/pricing", { pricing: backendPricing });
                  if (ok) nextStep();
                }}
                saving={saving}
              />
            )}
            {currentStep === 7 && (
              <StepPaymentMethod
                data={wizardData.paymentMethod}
                onSave={async (data) => {
                  setWizardData((prev) => ({ ...prev, paymentMethod: data }));
                  const ok = await saveStep("/setup-wizard/step/payment-method", data);
                  if (ok) nextStep();
                }}
                saving={saving}
              />
            )}
            {currentStep === 8 && (
              <StepCustomerFields
                data={wizardData.customerFields}
                onSave={async (data) => {
                  setWizardData((prev) => ({ ...prev, customerFields: data }));
                  const ok = await saveStep("/setup-wizard/step/customer-fields", data);
                  if (ok) nextStep();
                }}
                saving={saving}
              />
            )}
            {currentStep === 9 && (
              <StepReview
                data={wizardData}
                onFinalize={handleFinalize}
                saving={saving}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border/60">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="rounded-xl gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          {currentStep < 9 && (
            <Button variant="ghost" onClick={nextStep} className="text-muted-foreground rounded-xl gap-1.5">
              Skip for now
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
