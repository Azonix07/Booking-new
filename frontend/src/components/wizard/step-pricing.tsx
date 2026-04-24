"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Loader2, Plus, Trash2, Users, ArrowRight, Info } from "lucide-react";

interface DurationOption {
  minutes: number;
  label: string;
  price: number;
}

interface PlayerPricing {
  players: number;
  price: number;
}

interface DurationTier {
  minutes: number;
  label: string;
  playerPrices: PlayerPricing[];
}

interface ServicePricing {
  serviceName: string;
  maxPlayers: number;
  currency: string;
  durationTiers: DurationTier[];
}

interface Props {
  data: any[];
  services: { name: string; maxPlayersPerDevice: number; numberOfDevices?: number }[];
  onSave: (data: any[]) => void;
  saving: boolean;
}

const CURRENCIES = [
  { code: "INR", symbol: "₹" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "AED", symbol: "د.إ" },
];
const DURATION_OPTIONS = [
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hr" },
  { minutes: 120, label: "2 hrs" },
  { minutes: 180, label: "3 hrs" },
];

function getDurationLabel(minutes: number): string {
  if (minutes >= 60) {
    const hrs = minutes / 60;
    return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  }
  return `${minutes} min`;
}

export default function StepPricing({ data, services, onSave, saving }: Props) {
  const [currency, setCurrency] = useState("INR");
  const [servicePricings, setServicePricings] = useState<ServicePricing[]>([]);

  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || currency;

  useEffect(() => {
    if (data?.length && data[0]?.durationTiers) {
      setServicePricings(data);
      if (data[0]?.currency) setCurrency(data[0].currency);
      return;
    }

    const initial: ServicePricing[] = services.map((s) => {
      const maxP = s.maxPlayersPerDevice || 1;
      const playerPrices = Array.from({ length: maxP }, (_, i) => ({
        players: i + 1,
        price: 0,
      }));
      return {
        serviceName: s.name,
        maxPlayers: maxP,
        currency: "INR",
        durationTiers: [
          { minutes: 60, label: "1 hr", playerPrices: [...playerPrices] },
        ],
      };
    });
    setServicePricings(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePlayerPrice = (
    sIdx: number,
    tIdx: number,
    pIdx: number,
    value: string,
  ) => {
    const v = value.replace(/[^0-9.]/g, "");
    setServicePricings((prev) =>
      prev.map((sp, si) =>
        si !== sIdx
          ? sp
          : {
              ...sp,
              durationTiers: sp.durationTiers.map((dt, ti) =>
                ti !== tIdx
                  ? dt
                  : {
                      ...dt,
                      playerPrices: dt.playerPrices.map((pp, pi) =>
                        pi !== pIdx ? pp : { ...pp, price: v === "" ? 0 : parseFloat(v) },
                      ),
                    },
              ),
            },
      ),
    );
  };

  const addDurationTier = (sIdx: number) => {
    setServicePricings((prev) =>
      prev.map((sp, si) => {
        if (si !== sIdx) return sp;
        const usedMinutes = sp.durationTiers.map((d) => d.minutes);
        const nextDuration = DURATION_OPTIONS.find(
          (d) => !usedMinutes.includes(d.minutes),
        ) || { minutes: 60, label: "1 hr" };
        const playerPrices = Array.from({ length: sp.maxPlayers }, (_, i) => ({
          players: i + 1,
          price: 0,
        }));
        return {
          ...sp,
          durationTiers: [
            ...sp.durationTiers,
            { minutes: nextDuration.minutes, label: nextDuration.label, playerPrices },
          ],
        };
      }),
    );
  };

  const removeDurationTier = (sIdx: number, tIdx: number) => {
    setServicePricings((prev) =>
      prev.map((sp, si) =>
        si !== sIdx
          ? sp
          : { ...sp, durationTiers: sp.durationTiers.filter((_, ti) => ti !== tIdx) },
      ),
    );
  };

  const updateTierDuration = (sIdx: number, tIdx: number, minutes: number) => {
    setServicePricings((prev) =>
      prev.map((sp, si) =>
        si !== sIdx
          ? sp
          : {
              ...sp,
              durationTiers: sp.durationTiers.map((dt, ti) =>
                ti !== tIdx
                  ? dt
                  : { ...dt, minutes, label: getDurationLabel(minutes) },
              ),
            },
      ),
    );
  };

  const handleContinue = () => {
    const transformed = servicePricings.map((sp) => {
      const baseTier = sp.durationTiers[0];
      const basePrice = baseTier?.playerPrices[0]?.price || 0;
      const perAdditional =
        sp.maxPlayers > 1 && baseTier?.playerPrices.length > 1
          ? (baseTier.playerPrices[1]?.price || 0) - basePrice
          : 0;

      const durationOptions: DurationOption[] = sp.durationTiers.map((dt) => ({
        minutes: dt.minutes,
        label: dt.label,
        price: dt.playerPrices[0]?.price || 0,
      }));

      return {
        serviceName: sp.serviceName,
        basePrice: Math.max(0, basePrice),
        pricePerAdditionalPerson: Math.max(0, perAdditional),
        currency,
        durationOptions,
        durationTiers: sp.durationTiers,
        maxPlayers: sp.maxPlayers,
      };
    });
    onSave(transformed);
  };

  const allFilled = servicePricings.every((sp) =>
    sp.durationTiers.every((dt) => dt.playerPrices.some((pp) => pp.price > 0)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Set your prices</h2>
        <p className="text-muted-foreground mt-1.5">
          Price per booking. Add duration tiers if you charge more for longer sessions.
        </p>
      </div>

      {/* Currency */}
      <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-center gap-3">
        <DollarSign className="h-4 w-4 text-primary" />
        <Label className="text-sm font-semibold">Currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-32 ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Per-service pricing */}
      {servicePricings.map((sp, sIdx) => (
        <Card key={sIdx} className="border-2 border-border/60">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="font-bold text-base">{sp.serviceName}</p>
              {sp.maxPlayers > 1 && (
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Up to {sp.maxPlayers} people
                </span>
              )}
            </div>

            {sp.maxPlayers > 1 && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <span>Set a price for each number of players. Example: 1 player = ₹300, 2 players = ₹500.</span>
              </div>
            )}

            {sp.durationTiers.map((tier, tIdx) => (
              <div key={tIdx} className="border rounded-xl p-3 sm:p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <Select
                    value={String(tier.minutes)}
                    onValueChange={(v) => updateTierDuration(sIdx, tIdx, parseInt(v))}
                  >
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem key={d.minutes} value={String(d.minutes)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sp.durationTiers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-9 px-2"
                      onClick={() => removeDurationTier(sIdx, tIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Player pricing — stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {tier.playerPrices.map((pp, pIdx) => (
                    <div key={pIdx}>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {sp.maxPlayers === 1
                          ? "Price"
                          : `${pp.players} player${pp.players > 1 ? "s" : ""}`}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          {currencySymbol}
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={pp.price === 0 ? "" : pp.price}
                          onChange={(e) => updatePlayerPrice(sIdx, tIdx, pIdx, e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sp.durationTiers.length < DURATION_OPTIONS.length && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDurationTier(sIdx)}
                className="w-full border-dashed gap-2"
              >
                <Plus className="h-4 w-4" />
                Add another duration (e.g. 2 hr pricing)
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {services.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-4 text-center text-muted-foreground">
            No services added yet. Go back to the previous step and add a few.
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {allFilled ? "Prices set — ready to continue" : "Set at least one price to continue"}
        </p>
        <Button
          onClick={handleContinue}
          disabled={saving || services.length === 0}
          size="lg"
          className="gap-1.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
