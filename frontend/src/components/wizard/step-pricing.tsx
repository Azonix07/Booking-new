"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Loader2, Plus, Trash2, Users } from "lucide-react";

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

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];
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

  useEffect(() => {
    // Try to restore from saved data
    if (data?.length && data[0]?.durationTiers) {
      setServicePricings(data);
      if (data[0]?.currency) setCurrency(data[0].currency);
      return;
    }

    // Initialize from services with sensible defaults
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
    // Transform to backend-expected format:
    // { serviceName, basePrice, pricePerAdditionalPerson, currency, durationOptions }
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
        // Keep full player pricing data for reload
        durationTiers: sp.durationTiers,
        maxPlayers: sp.maxPlayers,
      };
    });
    onSave(transformed);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set your pricing</h2>
        <p className="text-muted-foreground mt-1">
          Configure prices per player count and time duration for each service
        </p>
      </div>

      {/* Currency selector */}
      <div className="flex items-center gap-3">
        <DollarSign className="h-5 w-5 text-primary" />
        <Label className="font-semibold">Currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Per-service pricing */}
      {servicePricings.map((sp, sIdx) => (
        <Card key={sIdx}>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-lg">{sp.serviceName}</p>
              {sp.maxPlayers > 1 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Up to {sp.maxPlayers} players
                </span>
              )}
            </div>

            {sp.durationTiers.map((tier, tIdx) => (
              <div key={tIdx} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Select
                      value={String(tier.minutes)}
                      onValueChange={(v) => updateTierDuration(sIdx, tIdx, parseInt(v))}
                    >
                      <SelectTrigger className="w-32">
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
                  </div>
                  {sp.durationTiers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeDurationTier(sIdx, tIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Player pricing grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {tier.playerPrices.map((pp, pIdx) => (
                    <div key={pIdx}>
                      <Label className="text-xs text-muted-foreground">
                        {sp.maxPlayers === 1
                          ? `Price (${currency})`
                          : `${pp.players} player${pp.players > 1 ? "s" : ""} (${currency})`}
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={pp.price === 0 ? "" : pp.price}
                        onChange={(e) => updatePlayerPrice(sIdx, tIdx, pIdx, e.target.value)}
                      />
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
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add duration tier
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {services.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-4 text-center text-muted-foreground">
            No services added yet. Go back and add services first.
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
