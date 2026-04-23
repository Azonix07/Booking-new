"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, GripVertical, X, Package, Monitor, Users, Clock, DollarSign, Tag, Layers, Timer, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Service } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05 },
  }),
};

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchServices = useCallback(async () => {
    if (!user?.tenantId) return;
    api.setTenantId(user.tenantId);
    try {
      const data = await api.get<Service[]>("/services");
      setServices(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const deleteService = async (id: string) => {
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch {}
  };

  if (loading) return <PageLoader />;

  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage your booking services"
        action={
          <Button className="rounded-xl gap-2" onClick={() => { setShowForm(true); setEditing(null); }}>
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        }
      />

      {/* Stats summary */}
      {services.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6"
        >
          {[
            { label: "Total Services", value: services.length, icon: Package, bg: "bg-blue-50", text: "text-blue-600" },
            { label: "Active", value: activeCount, icon: ShieldCheck, bg: "bg-emerald-50", text: "text-emerald-600" },
            { label: "Inactive", value: services.length - activeCount, icon: Clock, bg: "bg-amber-50", text: "text-amber-600" },
          ].map((sc, i) => (
            <motion.div key={sc.label} variants={fadeUp} custom={i}>
              <Card className="stat-card card-hover border-border/60 rounded-xl">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${sc.bg}`}>
                    <sc.icon className={`h-5 w-5 ${sc.text}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{sc.label}</p>
                    <p className="text-xl font-bold tracking-tight">{sc.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <ServiceForm
              tenantId={user!.tenantId!}
              serviceId={editing}
              service={editing ? services.find((s) => s._id === editing) : undefined}
              onClose={() => { setShowForm(false); setEditing(null); }}
              onSaved={() => { setShowForm(false); setEditing(null); fetchServices(); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border/60 border-dashed rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 mb-5">
                <Package className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-muted-foreground font-medium text-base">No services yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1 text-center max-w-sm">
                Create your first service to start accepting bookings from customers.
              </p>
              <Button
                className="mt-5 rounded-xl gap-2"
                onClick={() => { setShowForm(true); setEditing(null); }}
              >
                <Plus className="h-4 w-4" /> Add Your First Service
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial="hidden" animate="visible" className="space-y-2">
          {services.map((svc, i) => (
            <motion.div key={svc._id} variants={fadeUp} custom={i}>
              <Card className="border-border/60 card-hover rounded-xl">
                <CardContent className="flex items-center justify-between p-4 sm:p-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary shrink-0">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{svc.name}</h3>
                        <Badge
                          variant={svc.isActive ? "default" : "secondary"}
                          className="text-[11px] rounded-md"
                        >
                          {svc.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {svc.category && (
                          <Badge variant="outline" className="text-[11px] rounded-md border-border/60">
                            {svc.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(svc.price)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Monitor className="h-3 w-3" />
                          {svc.numberOfDevices} device(s)
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          Max {svc.maxTotalPlayers} players
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          {svc.defaultDuration}min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-9 w-9 hover:bg-primary/5 hover:text-primary"
                      onClick={() => { setEditing(svc._id); setShowForm(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-9 w-9 hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => deleteService(svc._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ServiceForm({
  tenantId,
  serviceId,
  service,
  onClose,
  onSaved,
}: {
  tenantId: string;
  serviceId: string | null;
  service?: Service;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || 0,
    numberOfDevices: service?.numberOfDevices || 1,
    maxPlayersPerDevice: service?.maxPlayersPerDevice || 4,
    maxTotalPlayers: service?.maxTotalPlayers || 8,
    defaultDuration: service?.defaultDuration || 30,
    bufferTime: service?.bufferTime || 5,
    category: service?.category || "gaming",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    api.setTenantId(tenantId);
    try {
      if (serviceId) {
        await api.put(`/services/${serviceId}`, form);
      } else {
        await api.post("/services", form);
      }
      onSaved();
    } catch {}
    setSubmitting(false);
  };

  const fields: { label: string; key: keyof typeof form; icon: React.ElementType; type?: string; min?: number; step?: number; span?: number; placeholder?: string }[] = [
    { label: "Name", key: "name", icon: Package, span: 2, placeholder: "e.g. VR Gaming Session" },
    { label: "Description", key: "description", icon: Layers, span: 2, placeholder: "Brief description of the service" },
    { label: "Price", key: "price", icon: DollarSign, type: "number", min: 0, step: 0.01 },
    { label: "Category", key: "category", icon: Tag, placeholder: "e.g. gaming" },
    { label: "Devices", key: "numberOfDevices", icon: Monitor, type: "number", min: 1 },
    { label: "Max Players/Device", key: "maxPlayersPerDevice", icon: Users, type: "number", min: 1 },
    { label: "Max Total Players", key: "maxTotalPlayers", icon: Users, type: "number", min: 1 },
    { label: "Default Duration (min)", key: "defaultDuration", icon: Clock, type: "number", min: 5 },
    { label: "Buffer Time (min)", key: "bufferTime", icon: Timer, type: "number", min: 0 },
  ];

  return (
    <Card className="mb-6 border-border/60 rounded-xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-purple-500" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              {serviceId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h3 className="font-semibold text-base">{serviceId ? "Edit Service" : "New Service"}</h3>
              <p className="text-xs text-muted-foreground">
                {serviceId ? "Update the service details below" : "Fill in the details to create a new service"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={`space-y-2 ${f.span === 2 ? "sm:col-span-2" : ""}`}>
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </Label>
              <Input
                className="rounded-xl border-border/60 focus-visible:ring-primary/20"
                type={f.type || "text"}
                min={f.min}
                step={f.step}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [f.key]: f.type === "number" ? +e.target.value : e.target.value,
                  })
                }
                required={f.key === "name"}
              />
            </div>
          ))}
          <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={submitting}>
              {submitting ? "Saving..." : serviceId ? "Update Service" : "Create Service"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
