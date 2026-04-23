"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const h = Math.floor(i / 1) ;
  return `${String(h).padStart(2, "0")}:00`;
}).filter((_, i) => i >= 6 && i <= 23);

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

  const applyToAll = () => {
    const monday = hours.find((h) => h.day === 1) || hours[1];
    setHours((prev) =>
      prev.map((h) => ({
        ...h,
        open: monday.open,
        close: monday.close,
        isClosed: h.day === 0 ? h.isClosed : false,
      })),
    );
  };

  const handleContinue = () => {
    if (sameForAll) applyToAll();
    onSave({ sameForAllDays: sameForAll, hours });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set your business hours</h2>
        <p className="text-muted-foreground mt-1">
          When can customers book appointments?
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Same timing for all days?</Label>
            <Switch checked={sameForAll} onCheckedChange={setSameForAll} />
          </div>

          {sameForAll ? (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">All days (except closed days)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Opening Time</Label>
                  <Select value={hours[1]?.open || "10:00"} onValueChange={(v) => updateHour(1, "open", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Closing Time</Label>
                  <Select value={hours[1]?.close || "22:00"} onValueChange={(v) => updateHour(1, "close", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <p className="text-xs text-muted-foreground">Mark closed days:</p>
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => updateHour(i, "isClosed", !hours[i]?.isClosed)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        hours[i]?.isClosed
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {name.slice(0, 3)} {hours[i]?.isClosed ? "✕" : "✓"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {DAY_NAMES.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-24">
                    <button
                      onClick={() => updateHour(i, "isClosed", !hours[i]?.isClosed)}
                      className={`w-full px-2 py-1 rounded text-xs font-medium ${
                        hours[i]?.isClosed
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {name.slice(0, 3)} {hours[i]?.isClosed ? "(Closed)" : ""}
                    </button>
                  </div>
                  {!hours[i]?.isClosed && (
                    <>
                      <Select value={hours[i]?.open || "10:00"} onValueChange={(v) => updateHour(i, "open", v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-sm">to</span>
                      <Select value={hours[i]?.close || "22:00"} onValueChange={(v) => updateHour(i, "close", v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
