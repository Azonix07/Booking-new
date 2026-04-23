"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { redirect("/login"); return; }
    if (!user) return;
    if (user.role === "super_admin") { redirect("/admin"); return; }
    if (user.role !== "client_admin") { redirect("/"); return; }

    const ob = user.onboarding;
    if (ob?.subscription?.status === "pending") { redirect("/list-your-business/pending"); return; }
    if (ob?.subscription?.status === "rejected") { redirect("/list-your-business/plans"); return; }
    if (ob?.tenantStatus === "suspended") { redirect("/list-your-business/pending"); return; }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) return null;
  if (!user || user.role !== "client_admin") return null;

  const ob = user.onboarding;
  if (ob?.subscription?.status !== "active" || ob?.tenantStatus !== "active") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
