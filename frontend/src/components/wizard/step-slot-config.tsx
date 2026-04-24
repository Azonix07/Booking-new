"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Loader2, Hourglass, CalendarClock, Coffee, UserCheck, ArrowRight } from "lucide-react";

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

  const formatDuration = (d: number) => (d >= 60 ? `${d / 60} hour${d > 60 ? "s" : ""}` : `${d} minutes`);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How do bookings work?</h2>
        <p className="text-muted-foreground mt-1.5">
          Set slot length and a couple of rules. You can tweak these later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Slot Duration */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">How long is each booking?</Label>
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
                  {formatDuration(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Most popular: 1 hour</p>
        </div>

        {/* Buffer Between Slots */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">Cleanup time between bookings</Label>
          </div>
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
          <p className="text-xs text-muted-foreground">Useful for turnover or resets</p>
        </div>

        {/* Minimum Notice */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">Earliest booking time</Label>
          </div>
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
            <span className="text-sm text-muted-foreground whitespace-nowrap">hours ahead</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Customers must book at least this far in advance
          </p>
        </div>

        {/* Max Advance Booking */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">How far ahead can they book?</Label>
          </div>
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
          <p className="text-xs text-muted-foreground">30 is a good default</p>
        </div>
      </div>

      {/* Walk-ins */}
      <div className="rounded-xl border border-border bg-background p-4 flex items-center justify-between">
        <div className="flex items-start gap-3 pr-4">
          <UserCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Allow walk-ins (same-day bookings)</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Skip the minimum-notice rule for today&apos;s bookings
            </p>
          </div>
        </div>
        <Switch
          checked={config.allowWalkIns}
          onCheckedChange={(checked) => update("allowWalkIns", checked)}
        />
      </div>

      {/* Preview */}
      <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-4">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">How it works</p>
        <p className="text-sm text-foreground leading-relaxed">
          Each booking runs <span className="font-semibold">{formatDuration(config.slotDurationMinutes)}</span>
          {(config.bufferBetweenSlotsMinutes ?? 0) > 0 && (
            <>, with a <span className="font-semibold">{config.bufferBetweenSlotsMinutes}-minute break</span> before the next</>
          )}
          . Customers book from{" "}
          <span className="font-semibold">{config.minBookingNoticeHours ?? 1} hour{(config.minBookingNoticeHours ?? 1) !== 1 ? "s" : ""} ahead</span> up to{" "}
          <span className="font-semibold">{config.maxAdvanceBookingDays ?? 30} days</span> in advance.
          {config.allowWalkIns && <> Walk-ins <span className="font-semibold">are accepted</span>.</>}
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onSave(config)}
          disabled={saving}
          size="lg"
          className="gap-1.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
