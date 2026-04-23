"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Globe,
  Activity,
  UserCheck,
  ShieldCheck,
  Star,
  IndianRupee,
  CreditCard,
} from "lucide-react";

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalCustomers: number;
  totalBusinessOwners: number;
  totalBookings: number;
  totalRevenue: number;
  totalReviews: number;
  pendingSubscriptions: number;
}

interface RecentActivity {
  recentUsers: any[];
  recentTenants: any[];
  recentBookings: any[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.04 },
  }),
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<PlatformStats>("/admin/stats").catch(() => null),
      api.get<RecentActivity>("/admin/activity").catch(() => null),
    ]).then(([s, a]) => {
      setStats(s);
      setActivity(a);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  const cards = [
    { label: "Total Businesses", value: stats?.totalTenants || 0, icon: Building2, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Active Businesses", value: stats?.activeTenants || 0, icon: Globe, bg: "bg-green-50", text: "text-green-600" },
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, bg: "bg-purple-50", text: "text-purple-600" },
    { label: "Customers", value: stats?.totalCustomers || 0, icon: UserCheck, bg: "bg-cyan-50", text: "text-cyan-600" },
    { label: "Business Owners", value: stats?.totalBusinessOwners || 0, icon: ShieldCheck, bg: "bg-indigo-50", text: "text-indigo-600" },
    { label: "Total Bookings", value: stats?.totalBookings || 0, icon: Activity, bg: "bg-orange-50", text: "text-orange-600" },
    { label: "Revenue", value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Reviews", value: stats?.totalReviews || 0, icon: Star, bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Pending Subs", value: stats?.pendingSubscriptions || 0, icon: CreditCard, bg: "bg-rose-50", text: "text-rose-600" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Platform Overview" description="Super Admin — system-wide metrics and activity" />

      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {cards.map((c, i) => (
          <motion.div key={c.label} variants={fadeUp} custom={i}>
            <Card className="stat-card card-hover border-border/60">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.bg}`}>
                  <c.icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-base">Recent Signups</h3>
                <Badge variant="secondary" className="text-xs rounded-md">{activity?.recentUsers?.length || 0} latest</Badge>
              </div>
              <div className="space-y-1">
                {activity?.recentUsers?.slice(0, 8).map((u: any) => (
                  <div key={u._id} className="flex items-center justify-between text-sm p-2.5 rounded-xl hover:bg-muted/50 transition-colors -mx-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary text-xs font-semibold shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium truncate block">{u.name}</span>
                        <span className="text-muted-foreground text-xs truncate block">{u.email}</span>
                      </div>
                    </div>
                    <Badge
                      variant={u.role === "client_admin" ? "default" : "secondary"}
                      className="text-[11px] rounded-md shrink-0 ml-2"
                    >
                      {u.role}
                    </Badge>
                  </div>
                )) || <p className="text-muted-foreground text-sm text-center py-6">No recent signups</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Businesses */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-base">Recent Businesses</h3>
                <Badge variant="secondary" className="text-xs rounded-md">{activity?.recentTenants?.length || 0} latest</Badge>
              </div>
              <div className="space-y-1">
                {activity?.recentTenants?.slice(0, 8).map((t: any) => (
                  <div key={t._id} className="flex items-center justify-between text-sm p-2.5 rounded-xl hover:bg-muted/50 transition-colors -mx-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold shrink-0">
                        {t.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium truncate block">{t.name}</span>
                        <span className="text-muted-foreground text-xs truncate block">{t.category}</span>
                      </div>
                    </div>
                    <Badge
                      variant={t.status === "active" ? "default" : t.status === "suspended" ? "destructive" : "outline"}
                      className="text-[11px] rounded-md shrink-0 ml-2"
                    >
                      {t.status}
                    </Badge>
                  </div>
                )) || <p className="text-muted-foreground text-sm text-center py-6">No businesses yet</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
