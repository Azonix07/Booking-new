"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Gamepad2, Monitor, Headphones, Box, BedDouble, Volleyball, Briefcase, PartyPopper, ArrowRight, Info, Sparkles } from "lucide-react";

const DEVICE_PRESETS: Record<string, { name: string; devices: number; playersPerDevice: number; bookingMode?: string; totalUnits?: number; unitType?: string; icon: any }[]> = {
  "gaming-lounge": [
    { name: "PS5 Station", devices: 2, playersPerDevice: 4, icon: Gamepad2 },
    { name: "VR Headset", devices: 1, playersPerDevice: 1, icon: Headphones },
    { name: "Driving Simulator", devices: 1, playersPerDevice: 1, icon: Monitor },
    { name: "PC Gaming", devices: 4, playersPerDevice: 1, icon: Monitor },
  ],
  "hotel": [
    { name: "Standard Room", devices: 1, playersPerDevice: 2, bookingMode: "date-range", totalUnits: 10, unitType: "room", icon: BedDouble },
    { name: "Deluxe Room", devices: 1, playersPerDevice: 2, bookingMode: "date-range", totalUnits: 5, unitType: "room", icon: BedDouble },
    { name: "Suite", devices: 1, playersPerDevice: 4, bookingMode: "date-range", totalUnits: 2, unitType: "suite", icon: BedDouble },
  ],
  "sports-facility": [
    { name: "Football Turf", devices: 1, playersPerDevice: 22, icon: Volleyball },
    { name: "Cricket Net", devices: 1, playersPerDevice: 6, icon: Volleyball },
    { name: "Badminton Court", devices: 1, playersPerDevice: 4, icon: Volleyball },
    { name: "Tennis Court", devices: 1, playersPerDevice: 4, icon: Volleyball },
  ],
  "salon": [
    { name: "Haircut Chair", devices: 3, playersPerDevice: 1, icon: Box },
    { name: "Spa Bed", devices: 2, playersPerDevice: 1, icon: Box },
    { name: "Manicure Station", devices: 2, playersPerDevice: 1, icon: Box },
  ],
  "medical": [
    { name: "Consultation Room", devices: 2, playersPerDevice: 1, icon: Box },
    { name: "Treatment Room", devices: 1, playersPerDevice: 1, icon: Box },
  ],
  "co-working": [
    { name: "Hot Desk", devices: 10, playersPerDevice: 1, icon: Briefcase },
    { name: "Private Cabin", devices: 1, playersPerDevice: 4, bookingMode: "date-range", totalUnits: 5, unitType: "cabin", icon: Briefcase },
    { name: "Meeting Room", devices: 1, playersPerDevice: 10, icon: Briefcase },
  ],
  "party-hall": [
    { name: "Main Hall", devices: 1, playersPerDevice: 100, icon: PartyPopper },
    { name: "Mini Hall", devices: 1, playersPerDevice: 50, icon: PartyPopper },
    { name: "Terrace Venue", devices: 1, playersPerDevice: 80, icon: PartyPopper },
  ],
};

interface ServiceItem {
  name: string;
  numberOfDevices: number;
  maxPlayersPerDevice: number;
  description?: string;
  category?: string;
  bookingMode?: string;
  totalUnits?: number;
  unitType?: string;
  isExclusive?: boolean;
}

interface Props {
  data: ServiceItem[];
  businessType: string;
  onSave: (data: ServiceItem[]) => void;
  saving: boolean;
}

const DATE_RANGE_TYPES = ["hotel"];
const EXCLUSIVE_TYPES = ["sports-facility", "party-hall"];

function getLabels(businessType: string, bookingMode?: string) {
  const isDateRange = DATE_RANGE_TYPES.includes(businessType) || bookingMode === "date-range";
  const isExclusive = EXCLUSIVE_TYPES.includes(businessType);

  if (isDateRange) {
    return {
      nameLabel: "Room name",
      namePlaceholder: "e.g. Deluxe Sea-View",
      quantityLabel: "How many of this type do you have?",
      capacityLabel: "Max guests per room",
    };
  }
  if (isExclusive) {
    return {
      nameLabel: "Venue name",
      namePlaceholder: "e.g. Main Turf",
      quantityLabel: "How many of these venues?",
      capacityLabel: "Max players on the venue",
    };
  }
  return {
    nameLabel: "Service or device name",
    namePlaceholder: "e.g. PS5 Station",
    quantityLabel: "How many units do you have?",
    capacityLabel: "Max people per unit",
  };
}

export default function StepServices({ data, businessType, onSave, saving }: Props) {
  const isDateRange = DATE_RANGE_TYPES.includes(businessType);
  const isExclusive = EXCLUSIVE_TYPES.includes(businessType);

  const [services, setServices] = useState<ServiceItem[]>(
    data?.length ? data : [],
  );

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        name: "",
        numberOfDevices: 1,
        maxPlayersPerDevice: 1,
        ...(isDateRange ? { bookingMode: "date-range", totalUnits: 1, unitType: "room" } : {}),
        ...(isExclusive ? { isExclusive: true } : {}),
      },
    ]);
  };

  const addPreset = (preset: (typeof DEVICE_PRESETS)[string][number]) => {
    const exists = services.some((s) => s.name === preset.name);
    if (exists) return;
    setServices((prev) => [
      ...prev,
      {
        name: preset.name,
        numberOfDevices: preset.devices,
        maxPlayersPerDevice: preset.playersPerDevice,
        ...(preset.bookingMode ? { bookingMode: preset.bookingMode } : {}),
        ...(preset.totalUnits ? { totalUnits: preset.totalUnits } : {}),
        ...(preset.unitType ? { unitType: preset.unitType } : {}),
        ...(isExclusive ? { isExclusive: true } : {}),
      },
    ]);
  };

  const updateService = (index: number, field: keyof ServiceItem, value: any) => {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    const valid = services.filter((s) => s.name.trim());
    if (!valid.length) return;
    onSave(valid);
  };

  const presets = DEVICE_PRESETS[businessType] || [];
  const validCount = services.filter((s) => s.name.trim()).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {isDateRange ? "What rooms do you offer?" : isExclusive ? "What venues can customers book?" : "What can customers book?"}
        </h2>
        <p className="text-muted-foreground mt-1.5">
          {isDateRange
            ? "Add each room type once. We'll ask you for pricing next."
            : isExclusive
              ? "Add each venue separately. Each booking blocks that venue for the slot."
              : "Add each bookable thing once — a room, a station, a chair, etc."}
        </p>
      </div>

      {/* Quick-add presets */}
      {presets.length > 0 && services.length === 0 && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Fast start — pick from common options
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.name}
                  onClick={() => addPreset(p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <Icon className="h-4 w-4" />
                  {p.name}
                  <Plus className="h-3 w-3 opacity-60" />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            You can edit numbers after adding, or add your own below.
          </p>
        </div>
      )}

      {presets.length > 0 && services.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const exists = services.some((s) => s.name === p.name);
            const Icon = p.icon;
            if (exists) return null;
            return (
              <button
                key={p.name}
                onClick={() => addPreset(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
              >
                <Icon className="h-3.5 w-3.5" />
                + {p.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Service list */}
      <div className="space-y-3">
        {services.map((service, index) => {
          const labels = getLabels(businessType, service.bookingMode);
          const useDateRange = isDateRange || service.bookingMode === "date-range";
          const qty = useDateRange ? (service.totalUnits || 0) : (service.numberOfDevices || 0);
          const cap = service.maxPlayersPerDevice || 0;
          const totalCapacity = qty * cap;

          return (
            <Card key={index} className="border-2 border-border/60">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs font-semibold">{labels.nameLabel}</Label>
                      <Input
                        placeholder={labels.namePlaceholder}
                        value={service.name}
                        onChange={(e) => updateService(index, "name", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {useDateRange ? (
                        <div>
                          <Label className="text-xs font-semibold">{labels.quantityLabel}</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            className="mt-1"
                            value={service.totalUnits === 0 ? "" : (service.totalUnits || "")}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9]/g, "");
                              updateService(index, "totalUnits", v === "" ? 0 : parseInt(v));
                            }}
                            onBlur={() => {
                              if (!service.totalUnits || service.totalUnits < 1)
                                updateService(index, "totalUnits", 1);
                            }}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs font-semibold">{labels.quantityLabel}</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            className="mt-1"
                            value={service.numberOfDevices === 0 ? "" : service.numberOfDevices}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9]/g, "");
                              updateService(index, "numberOfDevices", v === "" ? 0 : parseInt(v));
                            }}
                            onBlur={() => {
                              if (!service.numberOfDevices || service.numberOfDevices < 1)
                                updateService(index, "numberOfDevices", 1);
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <Label className="text-xs font-semibold">{labels.capacityLabel}</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          className="mt-1"
                          value={service.maxPlayersPerDevice === 0 ? "" : service.maxPlayersPerDevice}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, "");
                            updateService(index, "maxPlayersPerDevice", v === "" ? 0 : parseInt(v));
                          }}
                          onBlur={() => {
                            if (!service.maxPlayersPerDevice || service.maxPlayersPerDevice < 1)
                              updateService(index, "maxPlayersPerDevice", 1);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                    onClick={() => removeService(index)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Capacity preview */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>
                    {useDateRange
                      ? <>You can host up to <span className="font-semibold text-foreground">{totalCapacity || "—"}</span> guests across <span className="font-semibold text-foreground">{qty || "—"}</span> {service.unitType || "room"}(s) at once.</>
                      : <>At peak, up to <span className="font-semibold text-foreground">{totalCapacity || "—"}</span> customers can book this per slot ({qty || "—"} × {cap || "—"}).</>}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" onClick={addService} className="w-full rounded-xl h-12 border-dashed gap-2">
        <Plus className="h-4 w-4" />
        {services.length === 0 ? "Add your first service" : "Add another"}
      </Button>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {validCount === 0 ? "Add at least one to continue" : `${validCount} service${validCount !== 1 ? "s" : ""} added`}
        </p>
        <Button
          onClick={handleContinue}
          disabled={validCount === 0 || saving}
          size="lg"
          className="gap-1.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
