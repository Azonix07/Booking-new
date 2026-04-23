"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface RevenueByService {
  _id: string;
  name: string;
  revenue: number;
  count: number;
}

interface DailyTrend {
  _id: string;
  bookings: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState<RevenueByService[]>([]);
  const [trend, setTrend] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.setTenantId(user.tenantId);

    Promise.all([
      api.get<RevenueByService[]>("/dashboard/revenue-by-service"),
      api.get<DailyTrend[]>("/dashboard/daily-trend"),
    ])
      .then(([r, t]) => {
        setRevenue(Array.isArray(r) ? r : []);
        setTrend(Array.isArray(t) ? t : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoader />;

  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);

  return (
    <div>
      <PageHeader title="Analytics" description="Revenue and booking insights" />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by service */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {revenue.map((r) => (
                  <div key={r._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{r.name}</span>
                      <span className="font-medium">{formatCurrency(r.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.count} booking(s)</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Trend (Last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {trend.slice(-14).map((d) => (
                  <div key={d._id} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-muted-foreground text-xs">{d._id}</span>
                    <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-primary/70"
                        style={{
                          width: `${
                            (d.bookings /
                              Math.max(...trend.map((t) => t.bookings), 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs">{d.bookings} bkgs</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
