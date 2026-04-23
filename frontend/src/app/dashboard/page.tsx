"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  IndianRupee,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import type { DashboardStats, Booking } from "@/lib/types";
import { KpiCard } from "@/components/dashboard/kpi-card";

/** Generates a nice-looking 12-point synthetic trend so sparklines
 *  have shape before we wire real time-series endpoints. */
function syntheticSpark(base: number, variance = 0.35, points = 12) {
  const arr: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const wave = Math.sin(t * Math.PI * 1.5) * 0.3 + Math.cos(t * Math.PI * 3) * 0.15;
    const drift = t * 0.3;
    const jitter = (Math.random() - 0.5) * 0.1;
    arr.push(Math.max(0, base * (1 + (wave + drift + jitter) * variance)));
  }
  return arr;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.setTenantId(user.tenantId);

    Promise.all([
      api.get<DashboardStats>("/dashboard/stats"),
      api.get<Booking[]>("/dashboard/recent"),
    ])
      .then(([s, r]) => {
        setStats(s);
        setRecent(Array.isArray(r) ? r : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoader />;

  const kpis = stats
    ? [
        { label: "Total Bookings",   value: stats.totalBookings,   icon: Calendar,    trend: 12.4 },
        { label: "Revenue",          value: stats.totalRevenue,    icon: IndianRupee, trend: 8.2, prefix: "₹" },
        { label: "Total Players",    value: stats.totalPlayers,    icon: Users,       trend: 5.1 },
        { label: "Today's Bookings", value: stats.todaysBookings,  icon: TrendingUp,  trend: -2.3 },
        { label: "Upcoming",         value: stats.upcomingBookings,icon: Clock,       trend: 3.6 },
        { label: "Active Services",  value: stats.activeServices,  icon: CheckCircle },
      ]
    : [];

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${user?.name?.split(" ")[0] || "there"}`}
        description="Here's what's happening with your business today."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} prefix={k.prefix} icon={k.icon} trend={k.trend} />
        ))}
      </div>

      {/* Recent bookings */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-sm font-semibold">Recent Bookings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest {recent.length} bookings across your services
            </p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium">No bookings yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Bookings will appear here once customers start booking
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {recent.slice(0, 10).map((b) => {
              const customer = typeof b.customerId === "object" ? b.customerId : null;
              const service = typeof b.serviceId === "object" ? b.serviceId : null;
              const initial = customer?.name?.charAt(0)?.toUpperCase() ?? "C";
              return (
                <li key={b._id} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{customer?.name ?? "Customer"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {service?.name ?? "Service"} · {b.date} · {b.startTime}–{b.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-medium tabular-nums">{formatCurrency(b.totalAmount)}</span>
                    <Badge variant={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "destructive" : "secondary"}>
                      {b.status}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
