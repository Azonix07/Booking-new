"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  Building2,
  CalendarCog,
  Store,
  Tag,
  FileText,
  Clock,
  Bell,
  CalendarDays,
  XCircle,
  Coins,
  Globe,
  CheckCircle2,
} from "lucide-react";
import type { Tenant } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45 },
  }),
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.setTenantId(user.tenantId);
    api
      .get<Tenant>("/shop")
      .then(setTenant)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/shop/details", {
        name: tenant.name,
        description: tenant.description,
        category: tenant.category,
        tags: tenant.tags,
      });
      setSaved(true);
    } catch {}
    setSaving(false);
  };

  const handleSettingsSave = async () => {
    if (!tenant) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/shop/settings", tenant.shopSettings);
      setSaved(true);
    } catch {}
    setSaving(false);
  };

  if (loading) return <PageLoader />;
  if (!tenant)
    return <p className="text-muted-foreground p-6">Shop not configured.</p>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your shop details and booking settings"
      />

      {/* Animated success toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-green-800 shadow-lg shadow-green-100/50 dark:border-green-800 dark:bg-green-950/80 dark:text-green-300 dark:shadow-green-900/20"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Business Details */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Card className="rounded-xl border-border/60 overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Business Details
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Core information about your business
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  Business Name
                </Label>
                <Input
                  className="rounded-xl"
                  value={tenant.name}
                  onChange={(e) =>
                    setTenant({ ...tenant, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Category
                </Label>
                <Input
                  className="rounded-xl"
                  value={tenant.category}
                  onChange={(e) =>
                    setTenant({ ...tenant, category: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Description
              </Label>
              <Input
                className="rounded-xl"
                value={tenant.description}
                onChange={(e) =>
                  setTenant({ ...tenant, description: e.target.value })
                }
              />
            </div>
            <div className="pt-2">
              <Button
                className="rounded-xl"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Details"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Booking Settings */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Card className="rounded-xl border-border/60 overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarCog className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Booking Settings
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure scheduling rules and preferences
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Slot Interval (min)
                </Label>
                <Input
                  className="rounded-xl"
                  type="number"
                  value={tenant.shopSettings.slotInterval}
                  onChange={(e) =>
                    setTenant({
                      ...tenant,
                      shopSettings: {
                        ...tenant.shopSettings,
                        slotInterval: +e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                  Min Booking Notice (hrs)
                </Label>
                <Input
                  className="rounded-xl"
                  type="number"
                  value={tenant.shopSettings.minBookingNotice}
                  onChange={(e) =>
                    setTenant({
                      ...tenant,
                      shopSettings: {
                        ...tenant.shopSettings,
                        minBookingNotice: +e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  Max Advance Booking (days)
                </Label>
                <Input
                  className="rounded-xl"
                  type="number"
                  value={tenant.shopSettings.maxAdvanceBooking}
                  onChange={(e) =>
                    setTenant({
                      ...tenant,
                      shopSettings: {
                        ...tenant.shopSettings,
                        maxAdvanceBooking: +e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  Cancellation Window (hrs)
                </Label>
                <Input
                  className="rounded-xl"
                  type="number"
                  value={tenant.shopSettings.cancellationWindowHours}
                  onChange={(e) =>
                    setTenant({
                      ...tenant,
                      shopSettings: {
                        ...tenant.shopSettings,
                        cancellationWindowHours: +e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  Currency
                </Label>
                <Input
                  className="rounded-xl"
                  value={tenant.shopSettings.currency}
                  onChange={(e) =>
                    setTenant({
                      ...tenant,
                      shopSettings: {
                        ...tenant.shopSettings,
                        currency: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Timezone
                </Label>
                <Input
                  className="rounded-xl"
                  value={tenant.shopSettings.timezone}
                  onChange={(e) =>
                    setTenant({
                      ...tenant,
                      shopSettings: {
                        ...tenant.shopSettings,
                        timezone: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="pt-2">
              <Button
                className="rounded-xl"
                onClick={handleSettingsSave}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
