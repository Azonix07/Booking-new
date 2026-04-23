"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react";
import { cn, getSlotColor, getSlotBorderColor, formatTime } from "@/lib/utils";
import type { Service, SlotView } from "@/lib/types";

export default function SlotsPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.setTenantId(user.tenantId);
    api.get<Service[]>("/services")
      .then((data) => {
        const svcs = Array.isArray(data) ? data : [];
        setServices(svcs);
        if (svcs.length > 0) setSelectedService(svcs[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const fetchSlots = useCallback(async () => {
    if (!selectedService || !date) return;
    setSlotsLoading(true);
    try {
      const data = await api.get<SlotView[]>(`/bookings/availability?serviceId=${selectedService}&date=${date}`);
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedService, date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const toggleBlock = async (slotId: string, isBlocked: boolean) => {
    try {
      await api.put(`/slots/${isBlocked ? "unblock" : "block"}`, { slotIds: [slotId] });
      fetchSlots();
    } catch {}
  };

  const navigateDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Time Slots" description="View and manage slot availability" />

      {/* Service tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {services.map((svc) => (
          <Button
            key={svc._id}
            variant={selectedService === svc._id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedService(svc._id)}
          >
            {svc.name}
          </Button>
        ))}
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm bg-background"
        />
        <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs mb-4">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-[hsl(var(--slot-available))]" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-[hsl(var(--slot-filling))]" /> Filling
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-[hsl(var(--slot-full))]" /> Full
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-[hsl(var(--slot-blocked))]" /> Blocked
        </span>
      </div>

      {/* Slot grid */}
      {slotsLoading ? (
        <PageLoader />
      ) : slots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No slots found for this date. You may need to generate slots first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {slots.map((slot) => (
            <Card
              key={slot.slotId}
              className="overflow-hidden"
              style={{
                backgroundColor: `hsl(${getSlotColor(slot.status)})`,
                borderColor: `hsl(${getSlotBorderColor(slot.status)})`,
              }}
            >
              <CardContent className="p-3 text-center">
                <p className="font-medium text-sm">{formatTime(slot.startTime)}</p>
                <p className="text-xs">—</p>
                <p className="font-medium text-sm">{formatTime(slot.endTime)}</p>
                <div className="mt-2 text-xs">
                  {slot.bookedPlayers}/{slot.maxPlayers} booked
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={() => toggleBlock(slot.slotId, slot.status === "blocked")}
                >
                  {slot.status === "blocked" ? (
                    <><Unlock className="h-3 w-3 mr-1" /> Unblock</>
                  ) : (
                    <><Lock className="h-3 w-3 mr-1" /> Block</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
