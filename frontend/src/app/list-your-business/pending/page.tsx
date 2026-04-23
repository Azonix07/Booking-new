"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import type { SubscriptionPlan } from "@/lib/types";

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Free Plan",
  standard: "Standard Plan",
  ai: "AI Plan",
  full_service: "Full-Service Plan",
};

export default function PendingApprovalPage() {
  const router = useRouter();
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    refreshUser,
    logout,
  } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "client_admin") {
      router.push("/");
      return;
    }
    const ob = user?.onboarding;
    if (!ob?.setupCompleted) {
      router.push("/dashboard/setup");
      return;
    }
    if (!ob.subscription) {
      router.push("/list-your-business#plans");
      return;
    }
    if (
      ob.subscription.status === "active" &&
      ob.tenantStatus === "active"
    ) {
      router.push("/dashboard");
      return;
    }
    if (ob.subscription.status === "rejected") {
      router.push("/list-your-business#plans");
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleRefresh = async () => {
    await refreshUser();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subscription = user?.onboarding?.subscription;
  const planLabel = subscription?.plan
    ? PLAN_LABELS[subscription.plan]
    : "Plan";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <motion.div
        aria-hidden
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <Card className="border-border/60 shadow-xl">
          <CardContent className="pt-10 pb-10 space-y-8 text-center">
            <div className="relative mx-auto w-fit">
              <div
                className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"
                style={{ animationDuration: "3s" }}
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/50 mx-auto">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Approval Pending
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Your{" "}
                <span className="font-semibold text-foreground">
                  {planLabel}
                </span>{" "}
                subscription request is awaiting admin approval.
              </p>
            </div>

            <div className="bg-muted/40 rounded-2xl p-5 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  Business setup completed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {planLabel} requested
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-amber-700">
                  Waiting for admin approval
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              You&apos;ll get access to your dashboard once approved. This
              typically takes 1–2 business days.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRefresh}
                className="rounded-xl h-11 bg-primary border-0 text-white shadow-md hover:shadow-lg transition-all gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Check Status
              </Button>
              <Button
                onClick={logout}
                variant="ghost"
                className="rounded-xl text-muted-foreground gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
