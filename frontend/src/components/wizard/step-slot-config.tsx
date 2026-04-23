"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Loader2 } from "lucide-react";

interface SlotConfig {
  slotDurationMinutes: number;
  minBookingNoticeHours?: number;
  maxAdvanceBookingDays?: number;
  bufferBetweenSlotsMinutes?: number;
  allowWalkIns: boolean;
}

interface Props {
  data: SlotConfig | null;
  onSave: (data: SlotConfig) => void;
  saving: boolean;
}

const SLOT_DURATIONS = [15, 30, 45, 60, 90, 120];

export default function StepSlotConfig({ data, onSave, saving }: Props) {
  const [config, setConfig] = useState<SlotConfig>(
    data || {
      slotDurationMinutes: 60,
      minBookingNoticeHours: 1,
      maxAdvanceBookingDays: 30,
      bufferBetweenSlotsMinutes: 0,
      allowWalkIns: false,
    },
  );

  const update = (field: keyof SlotConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configure your time slots</h2>
        <p className="text-muted-foreground mt-1">
          Set how time slots work for your bookings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slot Duration */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <Label className="text-sm font-semibold">Slot Duration</Label>
            </div>
            <Select
              value={String(config.slotDurationMinutes)}
              onValueChange={(v) => update("slotDurationMinutes", parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d >= 60 ? `${d / 60} hour${d > 60 ? "s" : ""}` : `${d} minutes`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Length of each bookable time slot</p>
          </CardContent>
        </Card>

        {/* Buffer Between Slots */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Label className="text-sm font-semibold">Buffer Between Slots</Label>
            <Select
              value={String(config.bufferBetweenSlotsMinutes)}
              onValueChange={(v) => update("bufferBetweenSlotsMinutes", parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 5, 10, 15, 30].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d === 0 ? "No buffer" : `${d} minutes`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Gap between consecutive bookings</p>
          </CardContent>
        </Card>

        {/* Minimum Notice */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Label className="text-sm font-semibold">Minimum Booking Notice</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={config.minBookingNoticeHours === undefined ? "" : config.minBookingNoticeHours === 0 ? "0" : config.minBookingNoticeHours}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  update("minBookingNoticeHours", v === "" ? undefined : Math.min(parseInt(v), 72));
                }}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">hours</span>
            </div>
            <p className="text-xs text-muted-foreground">
              How far in advance customers must book
            </p>
          </CardContent>
        </Card>

        {/* Max Advance Booking */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Label className="text-sm font-semibold">Max Advance Booking</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={config.maxAdvanceBookingDays === undefined ? "" : config.maxAdvanceBookingDays === 0 ? "0" : config.maxAdvanceBookingDays}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  update("maxAdvanceBookingDays", v === "" ? undefined : Math.min(parseInt(v), 365));
                }}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
            </div>
            <p className="text-xs text-muted-foreground">
              How far ahead customers can book
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Walk-ins */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Allow Walk-ins</p>
              <p className="text-sm text-muted-foreground">
                Let customers book same-day without minimum notice
              </p>
            </div>
            <Switch
              checked={config.allowWalkIns}
              onCheckedChange={(checked) => update("allowWalkIns", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-2">Preview</p>
          <p className="text-sm text-muted-foreground">
            Each slot is <span className="font-medium text-foreground">{config.slotDurationMinutes} minutes</span>
            {(config.bufferBetweenSlotsMinutes ?? 0) > 0 && (
              <> with a <span className="font-medium text-foreground">{config.bufferBetweenSlotsMinutes} min</span> buffer</>
            )}
            . Customers must book at least{" "}
            <span className="font-medium text-foreground">{config.minBookingNoticeHours ?? 1} hour{(config.minBookingNoticeHours ?? 1) !== 1 ? "s" : ""}</span> in advance,
            up to{" "}
            <span className="font-medium text-foreground">{config.maxAdvanceBookingDays ?? 30} days</span> ahead.
            {config.allowWalkIns && " Walk-ins are accepted."}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(config)} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
