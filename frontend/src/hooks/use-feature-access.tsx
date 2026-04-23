"use client";

import { useAuth } from "@/lib/auth-context";
import type { SubscriptionPlan } from "@/lib/types";

const FEATURE_PLAN_MAP: Record<string, SubscriptionPlan[]> = {
  "customizable-pages": ["standard", "ai", "full_service"],
  "theme-selection": ["standard", "ai", "full_service"],
  "editable-nav": ["standard", "ai", "full_service"],
  "advanced-analytics": ["standard", "ai", "full_service"],
  "ai-website": ["ai", "full_service"],
  "ai-regenerate": ["ai", "full_service"],
  "custom-domain": ["full_service"],
  "white-label": ["full_service"],
  "api-access": ["full_service"],
};

export function useFeatureAccess() {
  const { user } = useAuth();

  const subscriptionPlan = user?.onboarding?.subscription?.plan || null;
  const isActive = user?.onboarding?.subscription?.status === "active";

  const hasFeature = (feature: string): boolean => {
    if (!subscriptionPlan || !isActive) return false;
    const allowedPlans = FEATURE_PLAN_MAP[feature];
    if (!allowedPlans) return true;
    return allowedPlans.includes(subscriptionPlan);
  };

  return { subscriptionPlan, isActive, hasFeature };
}

export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasFeature } = useFeatureAccess();

  if (hasFeature(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1">Feature Locked</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        This feature requires a higher plan. Upgrade your subscription to unlock it.
      </p>
    </div>
  );
}
