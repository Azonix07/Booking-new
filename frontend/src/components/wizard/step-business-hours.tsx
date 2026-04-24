"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, ArrowRight, Power, PowerOff } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_OPTIONS = Array.from({ length: 18 }, (_, i) => {
  const h = i + 6; // 06:00 to 23:00
  return `${String(h).padStart(2, "0")}:00`;
});

function formatTime(t: string) {
  if (!t) return "";
  const [h] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12} ${period}`;
}

function defaultHours() {
  return DAY_NAMES.map((_, i) => ({
    day: i,
    open: "10:00",
    close: "22:00",
    isClosed: i === 0,
  }));
}

interface Props {
  data: { sameForAllDays: boolean; hours: any[] } | null;
  onSave: (data: { sameForAllDays: boolean; hours: any[] }) => void;
  saving: boolean;
}

export default function StepBusinessHours({ data, onSave, saving }: Props) {
  const [sameForAll, setSameForAll] = useState(data?.sameForAllDays ?? true);
  const [hours, setHours] = useState(data?.hours?.length === 7 ? data.hours : defaultHours());

  const updateHour = (dayIndex: number, field: string, value: any) => {
    setHours((prev) =>
      prev.map((h) => (h.day === dayIndex ? { ...h, [field]: value } : h)),
    );
  };

  const applyToAll = (source: typeof hours) => {
    const monday = source.find((h) => h.day === 1) || source[1];
    return source.map((h) => ({
      ...h,
      open: monday.open,
      close: monday.close,
    }));
  };

  const handleContinue = () => {
    const toSave = sameForAll ? applyToAll(hours) : hours;
    onSave({ sameForAllDays: sameForAll, hours: toSave });
  };

  const openDaysCount = hours.filter((h) => !h.isClosed).length;

  const previewText = useMemo(() => {
    if (openDaysCount === 0) return "Not open any day — add at least one open day.";
    if (sameForAll) {
      const t = hours[1];
      return `Open ${openDaysCount} day${openDaysCount !== 1 ? "s" : ""} a week, ${formatTime(t.open)} – ${formatTime(t.close)}`;
    }
    return `Custom hours on ${openDaysCount} open day${openDaysCount !== 1 ? "s" : ""}`;
  }, [hours, sameForAll, openDaysCount]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">When are you open?</h2>
        <p className="text-muted-foreground mt-1.5">
          Pick the hours customers can book. You can change this anytime.
        </p>
      </div>

      {/* Same / custom toggle */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between">
        <div className="pr-4">
          <p className="text-sm font-semibold">Same hours every open day</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Turn off if, say, weekends have different timings
          </p>
        </div>
        <Switch checked={sameForAll} onCheckedChange={setSameForAll} />
      </div>

      {/* Days strip */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Open on these days</Label>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAY_NAMES.map((name, i) => {
            const isClosed = hours[i]?.isClosed;
            return (
              <button
                key={i}
                onClick={() => updateHour(i, "isClosed", !isClosed)}
                className={`flex flex-col items-center gap-0.5 rounded-lg border-2 px-1 py-2.5 transition-all ${
                  isClosed
                    ? "border-border bg-muted/40 text-muted-foreground/60"
                    : "border-primary bg-primary/10 text-primary shadow-sm"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide">{name.slice(0, 3)}</span>
                {isClosed ? (
                  <PowerOff className="h-3.5 w-3.5" />
                ) : (
                  <Power className="h-3.5 w-3.5" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Tap to toggle open/closed</p>
      </div>

      {/* Time pickers */}
      {sameForAll ? (
        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-primary" />
            Hours on open days
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Opens at</Label>
              <Select value={hours[1]?.open || "10:00"} onValueChange={(v) => updateHour(1, "open", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Closes at</Label>
              <Select value={hours[1]?.close || "22:00"} onValueChange={(v) => updateHour(1, "close", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Custom hours per day</Label>
          <div className="space-y-2">
            {DAY_NAMES.map((name, i) => {
              const isClosed = hours[i]?.isClosed;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isClosed ? "bg-muted/30 border-dashed opacity-60" : "bg-background border-border"
                  }`}
                >
                  <span className="w-16 text-sm font-semibold">{name.slice(0, 3)}</span>
                  {isClosed ? (
                    <span className="flex-1 text-sm text-muted-foreground italic">Closed</span>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <Select value={hours[i]?.open || "10:00"} onValueChange={(v) => updateHour(i, "open", v)}>
                        <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-xs">to</span>
                      <Select value={hours[i]?.close || "22:00"} onValueChange={(v) => updateHour(i, "close", v)}>
                        <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live preview */}
      <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-4 flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Preview</p>
          <p className="text-sm font-medium text-foreground">{previewText}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={saving || openDaysCount === 0}
          size="lg"
          className="gap-1.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
