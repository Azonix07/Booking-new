"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Loader2,
  Check,
  Save,
  Sparkles,
  AlertCircle,
  X,
  Building2,
  MapPin,
  Clock,
  Gamepad2,
  Timer,
  DollarSign,
  CreditCard,
  UserCircle,
  Rocket,
} from "lucide-react";

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
  { id: 1, label: "Business", fullLabel: "Business Type", key: "business_type", icon: Building2, estMin: 1 },
  { id: 2, label: "Location", fullLabel: "Location", key: "location", icon: MapPin, estMin: 1 },
  { id: 3, label: "Hours", fullLabel: "Business Hours", key: "business_hours", icon: Clock, estMin: 1 },
  { id: 4, label: "Services", fullLabel: "Services", key: "services", icon: Gamepad2, estMin: 2 },
  { id: 5, label: "Slots", fullLabel: "Slot Config", key: "slot_config", icon: Timer, estMin: 1 },
  { id: 6, label: "Pricing", fullLabel: "Pricing", key: "pricing", icon: DollarSign, estMin: 2 },
  { id: 7, label: "Payment", fullLabel: "Payment", key: "payment_method", icon: CreditCard, estMin: 1 },
  { id: 8, label: "Customer", fullLabel: "Customer Info", key: "customer_fields", icon: UserCircle, estMin: 1 },
  { id: 9, label: "Review", fullLabel: "Review & Launch", key: "review_create", icon: Rocket, estMin: 1 },
];

const ENCOURAGEMENT: Record<number, string> = {
  3: "Nice — you're getting through this fast.",
  5: "Halfway there. Keep going!",
  7: "Almost done — just a couple more steps.",
  8: "Last setup step before launch!",
  9: "Final step. Review everything and launch your site.",
};

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
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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

  // Toast auto-dismiss
  useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(null), 2500);
    return () => clearTimeout(t);
  }, [savedToast]);

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
      const stepLabel = STEPS[currentStep - 1].fullLabel;
      if (!completedSteps.includes(stepKey)) {
        setCompletedSteps((prev) => [...prev, stepKey]);
      }
      setSavedToast(`${stepLabel} saved`);
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
      await refreshUser();
      const freshUser = await api.get<any>("/auth/me");
      const ob = freshUser?.onboarding;
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

  const completedCount = completedSteps.length;
  const percent = Math.round((completedCount / STEPS.length) * 100);
  const remainingMin = STEPS.slice(currentStep - 1).reduce((sum, s) => sum + s.estMin, 0);
  const CurrentIcon = STEPS[currentStep - 1].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20">
      {/* Sticky progress header */}
      <div className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/20 shrink-0">
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold leading-tight truncate">
                  Step {currentStep} · {STEPS[currentStep - 1].fullLabel}
                </h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {completedCount} of {STEPS.length} done · ~{remainingMin} min left
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {percent}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExitConfirm(true)}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save & exit</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>

          {/* Progress bar with completion fill */}
          <div className="relative">
            <div className="h-1.5 rounded-full bg-muted-foreground/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={false}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-between mt-3">
              {STEPS.map((step) => {
                const isCompleted = completedSteps.includes(step.key);
                const isCurrent = currentStep === step.id;
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className="group flex flex-col items-center gap-1 flex-1 min-w-0"
                    aria-label={`Go to step ${step.id}: ${step.fullLabel}`}
                  >
                    <div
                      className={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all ${
                        isCompleted
                          ? "bg-primary text-white shadow-sm shadow-primary/30"
                          : isCurrent
                            ? "bg-primary/15 text-primary ring-2 ring-primary"
                            : "bg-muted text-muted-foreground/60 group-hover:bg-muted-foreground/20"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    <span
                      className={`text-[9px] sm:text-[11px] font-medium transition-colors hidden sm:block truncate max-w-full ${
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground/70"
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
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {/* Encouragement */}
        {ENCOURAGEMENT[currentStep] && (
          <motion.div
            key={`enc-${currentStep}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-2 text-sm text-primary/90 font-medium"
          >
            <Sparkles className="h-4 w-4" />
            {ENCOURAGEMENT[currentStep]}
          </motion.div>
        )}

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-200"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Couldn&apos;t save your progress</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700 transition-colors p-1"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
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
                onGoToStep={goToStep}
                saving={saving}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom nav — only Back; primary action is inside each step */}
        {currentStep > 1 && (
          <div className="flex justify-start mt-8 pt-6 border-t border-border/60">
            <Button
              variant="ghost"
              onClick={prevStep}
              className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </div>

      {/* Save toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2.5 shadow-xl shadow-foreground/20 text-sm font-medium"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
              <Check className="h-3 w-3 text-white" />
            </div>
            {savedToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save & exit confirmation */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30 shrink-0">
                  <Save className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Your progress is saved</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Everything you&apos;ve filled in is safe. You can come back anytime to finish — we&apos;ll pick up right where you left off.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button
                  variant="outline"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1"
                >
                  Keep going
                </Button>
                <Button
                  onClick={() => router.push("/")}
                  className="flex-1"
                >
                  Exit setup
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
