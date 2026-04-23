"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Scissors, Stethoscope, Dumbbell, UtensilsCrossed, Camera, GraduationCap, Building2, Loader2, Hotel, Volleyball, PartyPopper, Briefcase } from "lucide-react";

const BUSINESS_TYPES = [
  { id: "gaming-lounge", label: "Gaming Lounge", icon: Gamepad2, color: "text-purple-500" },
  { id: "hotel", label: "Hotel / Resort", icon: Hotel, color: "text-sky-500" },
  { id: "sports-facility", label: "Sports Turf", icon: Volleyball, color: "text-emerald-500" },
  { id: "salon", label: "Salon & Spa", icon: Scissors, color: "text-pink-500" },
  { id: "medical", label: "Clinic / Medical", icon: Stethoscope, color: "text-blue-500" },
  { id: "fitness", label: "Fitness & Gym", icon: Dumbbell, color: "text-green-500" },
  { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, color: "text-orange-500" },
  { id: "co-working", label: "Co-working", icon: Briefcase, color: "text-amber-500" },
  { id: "party-hall", label: "Party Hall", icon: PartyPopper, color: "text-rose-500" },
  { id: "photography", label: "Photography", icon: Camera, color: "text-yellow-500" },
  { id: "education", label: "Education", icon: GraduationCap, color: "text-indigo-500" },
  { id: "other", label: "Other", icon: Building2, color: "text-gray-500" },
];

interface Props {
  data: { category: string; customCategory?: string } | null;
  onSave: (data: { category: string; customCategory?: string }) => void;
  saving: boolean;
}

export default function StepBusinessType({ data, onSave, saving }: Props) {
  const [selected, setSelected] = useState(data?.category || "");
  const [customCategory, setCustomCategory] = useState(data?.customCategory || "");

  const handleContinue = () => {
    if (!selected) return;
    onSave({
      category: selected,
      customCategory: selected === "other" ? customCategory : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">What type of business do you run?</h2>
        <p className="text-muted-foreground mt-1">
          This helps us customize your booking website
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSelected(type.id)}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all cursor-pointer hover:shadow-md ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <Icon className={`h-8 w-8 ${isSelected ? "text-primary" : type.color}`} />
              <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected === "other" && (
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="customCategory">What is your business type?</Label>
            <Input
              id="customCategory"
              placeholder="e.g., Co-working space, Pet grooming..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="mt-2"
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selected || (selected === "other" && !customCategory) || saving}
          size="lg"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
