"use client";

import { motion } from "framer-motion";
import { Clock, Info } from "lucide-react";
import type { Service, SlotView, SlotStatus } from "@/lib/types";
import { DateStrip } from "./date-strip";
import { SlotTile } from "./slot-tile";

/* ─── Legend ───────────────────────────────────────────────────────────────── */

const LEGEND: { status: SlotStatus; label: string; dot: string }[] = [
  { status: "available", label: "Available", dot: "bg-emerald-500" },
  { status: "filling",   label: "Filling",   dot: "bg-amber-500" },
  { status: "full",      label: "Full",      dot: "bg-red-500" },
  { status: "blocked",   label: "Blocked",   dot: "bg-gray-400" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface TimeSlotGridProps {
  slots: SlotView[];
  selectedSlots: string[];
  canStartFrom: Set<string>;
  slotsNeeded: number;
  currentService: Service | undefined;
  hoveredSlot: string | null;
  slotsLoading: boolean;
  prevSlots: Map<string, SlotStatus>;
  selectedDate: string;
  numberOfPersons: number;
  selectedDuration: { minutes: number; label: string; price: number } | null;
  onDateChange: (d: string) => void;
  onSlotToggle: (slotId: string) => void;
  onHover: (slotId: string | null) => void;
}

const gridContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.022 } },
};

const gridItem = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function TimeSlotGrid({
  slots,
  selectedSlots,
  canStartFrom,
  slotsNeeded,
  currentService,
  hoveredSlot,
  slotsLoading,
  selectedDate,
  selectedDuration,
  onDateChange,
  onSlotToggle,
  onHover,
}: TimeSlotGridProps) {
  return (
    <div className="space-y-7">
      {/* ── Date Picker ─────────────────────────────────────────────── */}
      <DateStrip selected={selectedDate} onSelect={onDateChange} />

      {/* ── Header + Legend ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-white text-sm font-bold">
              4
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Select Time</h2>
              <p className="text-xs text-muted-foreground">
                Tap any available slot to start your session
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {LEGEND.map(({ status, label, dot }) => (
              <span key={status} className="flex items-center gap-1.5 text-[11px]">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-muted-foreground">{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Grid ─────────────────────────────────────────────────── */}
        {slotsLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-dashed py-20 text-center bg-gray-50">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-medium">No slots for this date</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try selecting a different date above
            </p>
          </div>
        ) : (
          <motion.div
            key={`${selectedDate}-${currentService?._id}`}
            variants={gridContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
          >
            {slots.map((slot) => {
              const isSelected = selectedSlots.includes(slot.slotId);
              const canSelect = canStartFrom.has(slot.slotId);
              const isInSelection = isSelected;
              const isHovered = hoveredSlot === slot.slotId;

              return (
                <motion.div key={slot.slotId} variants={gridItem} layout>
                  <SlotTile
                    slot={slot}
                    selected={isSelected}
                    inSelection={isInSelection}
                    canSelect={canSelect}
                    isHovered={isHovered}
                    service={currentService}
                    onClick={() => onSlotToggle(slot.slotId)}
                    onHover={(h) => onHover(h ? slot.slotId : null)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Consecutive slots helper */}
        {slotsNeeded > 1 && slots.length > 0 && (
          <div className="mt-5 flex items-center gap-2 px-4 py-3 rounded-lg border bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-foreground">
              Your <span className="font-semibold">{selectedDuration?.label}</span> session needs{" "}
              <span className="font-semibold">{slotsNeeded}</span> consecutive slots.
              Tap any open slot to start.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
