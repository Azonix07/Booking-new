"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Scissors, Stethoscope, Dumbbell, UtensilsCrossed, Camera, GraduationCap, Building2, Loader2, Hotel, Volleyball, PartyPopper, Briefcase, ArrowRight } from "lucide-react";

const BUSINESS_TYPES = [
  { id: "gaming-lounge", label: "Gaming Lounge", icon: Gamepad2, hint: "PS5, VR, PC stations" },
  { id: "hotel", label: "Hotel / Resort", icon: Hotel, hint: "Rooms, suites, stays" },
  { id: "sports-facility", label: "Sports Turf", icon: Volleyball, hint: "Turf, courts, nets" },
  { id: "salon", label: "Salon & Spa", icon: Scissors, hint: "Haircuts, massage, nails" },
  { id: "medical", label: "Clinic / Medical", icon: Stethoscope, hint: "Doctors, treatments" },
  { id: "fitness", label: "Fitness & Gym", icon: Dumbbell, hint: "Trainers, classes" },
  { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, hint: "Tables, reservations" },
  { id: "co-working", label: "Co-working", icon: Briefcase, hint: "Desks, cabins, meeting rooms" },
  { id: "party-hall", label: "Party Hall", icon: PartyPopper, hint: "Venues, halls, events" },
  { id: "photography", label: "Photography", icon: Camera, hint: "Studio time, sessions" },
  { id: "education", label: "Education", icon: GraduationCap, hint: "Classes, tutoring" },
  { id: "other", label: "Other", icon: Building2, hint: "Tell us what you run" },
];

interface Props {
  data: { category: string; customCategory?: string } | null;
  onSave: (data: { category: string; customCategory?: string }) => void;
  saving: boolean;
}

export default function StepBusinessType({ data, onSave, saving }: Props) {
  const [selected, setSelected] = useState(data?.category || "");
  const [customCategory, setCustomCategory] = useState(data?.customCategory || "");
  const customRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected === "other") {
      setTimeout(() => customRef.current?.focus(), 150);
    }
  }, [selected]);

  const handleContinue = () => {
    if (!selected) return;
    if (selected === "other" && !customCategory.trim()) return;
    onSave({
      category: selected,
      customCategory: selected === "other" ? customCategory.trim() : undefined,
    });
  };

  const canContinue = !!selected && (selected !== "other" || customCategory.trim().length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">What type of business do you run?</h2>
        <p className="text-muted-foreground mt-1.5">
          Pick the closest match — we&apos;ll tailor the next steps to how your bookings work.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSelected(type.id)}
              className={`group relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="w-full">
                <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {type.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {type.hint}
                </p>
              </div>
              {isSelected && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected === "other" && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label htmlFor="customCategory" className="text-sm font-semibold">
            What kind of business is it?
          </Label>
          <Input
            ref={customRef}
            id="customCategory"
            placeholder="e.g. Pet grooming, Escape room, Karaoke lounge..."
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canContinue) handleContinue(); }}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">
            One or two words is plenty — we&apos;ll use this label across your booking page.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {selected ? "Tap Continue when ready" : "Select one to continue"}
        </p>
        <Button
          onClick={handleContinue}
          disabled={!canContinue || saving}
          size="lg"
          className="gap-1.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
