"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Gamepad2, Monitor, Headphones, Box, BedDouble, Volleyball, Briefcase, PartyPopper } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add your services or devices</h2>
        <p className="text-muted-foreground mt-1">
          What can customers book at your business?
        </p>
      </div>

      {/* Quick-add presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => {
              const Icon = p.icon;
              const exists = services.some((s) => s.name === p.name);
              return (
                <button
                  key={p.name}
                  onClick={() => addPreset(p)}
                  disabled={exists}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    exists
                      ? "border-primary/30 bg-primary/5 text-primary opacity-60"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {p.name}
                  {exists && <span className="text-xs">(Added)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Service list */}
      <div className="space-y-3">
        {services.map((service, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">
                      {isDateRange ? "Room / Unit Name" : "Service / Device Name"}
                    </Label>
                    <Input
                      placeholder={isDateRange ? "e.g. Deluxe Room" : isExclusive ? "e.g. Football Turf" : "e.g. PS5 Station"}
                      value={service.name}
                      onChange={(e) => updateService(index, "name", e.target.value)}
                    />
                  </div>
                  {isDateRange || service.bookingMode === "date-range" ? (
                    <>
                      <div>
                        <Label className="text-xs">Total Units Available</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
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
                      <div>
                        <Label className="text-xs">Max Guests per Unit</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
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
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs">
                          {isExclusive ? "Number of Courts/Venues" : "Number of Devices/Seats"}
                        </Label>
                        <Input
                          type="text"
                          inputMode="numeric"
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
                      <div>
                        <Label className="text-xs">
                          {isExclusive ? "Max Players per Session" : "Max Players per Device"}
                        </Label>
                        <Input
                          type="text"
                          inputMode="numeric"
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
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-5 text-destructive hover:text-destructive"
                  onClick={() => removeService(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isDateRange || service.bookingMode === "date-range"
                  ? `${service.totalUnits || 1} ${service.unitType || "unit"}(s) · ${service.maxPlayersPerDevice} guest(s) max per unit`
                  : `Total capacity: ${service.numberOfDevices * service.maxPlayersPerDevice} players per slot`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addService} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Service / Device
      </Button>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!services.some((s) => s.name.trim()) || saving}
          size="lg"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
