"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Moon,
  BedDouble,
  Loader2,
  Info,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Service, DateAvailability } from "@/lib/types";

interface DateRangeSelectorProps {
  service: Service;
  checkIn: string;
  checkOut: string;
  numberOfUnits: number;
  onCheckInChange: (d: string) => void;
  onCheckOutChange: (d: string) => void;
  onUnitsChange: (n: number) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function diffDays(a: string, b: string): number {
  const ms = new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function toLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/* ─── Calendar Grid ────────────────────────────────────────────────────────── */

function CalendarMonth({
  year,
  month,
  checkIn,
  checkOut,
  availability,
  numberOfUnits,
  onSelect,
}: {
  year: number;
  month: number;
  checkIn: string;
  checkOut: string;
  availability: Map<string, DateAvailability>;
  numberOfUnits: number;
  onSelect: (d: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = dateStr < today;
          const isCheckIn = dateStr === checkIn;
          const isCheckOut = dateStr === checkOut;
          const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
          const avail = availability.get(dateStr);
          const hasCapacity = !avail || avail.available >= numberOfUnits;
          const isDisabled = isPast || (!hasCapacity && !isCheckIn && !isCheckOut);

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(dateStr)}
              className={cn(
                "relative h-9 w-full text-xs font-medium rounded-lg transition-all duration-200",
                isPast && "text-muted-foreground/30 cursor-not-allowed",
                !isPast && !isDisabled && "hover:bg-primary/10 cursor-pointer",
                isCheckIn && "bg-primary text-white rounded-r-none",
                isCheckOut && "bg-primary text-white rounded-l-none",
                isInRange && "bg-primary/10 text-primary rounded-none",
                !isPast && !isCheckIn && !isCheckOut && !isInRange && !isDisabled && hasCapacity && "text-foreground",
                !isPast && !isCheckIn && !isCheckOut && !isInRange && !hasCapacity && "text-red-400/50 line-through",
              )}
            >
              {day}
              {/* availability dot */}
              {avail && !isPast && !isCheckIn && !isCheckOut && (
                <span
                  className={cn(
                    "absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full",
                    avail.available >= numberOfUnits ? "bg-emerald-500" : avail.available > 0 ? "bg-amber-500" : "bg-red-500",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function DateRangeSelector({
  service,
  checkIn,
  checkOut,
  numberOfUnits,
  onCheckInChange,
  onCheckOutChange,
  onUnitsChange,
}: DateRangeSelectorProps) {
  const [availability, setAvailability] = useState<Map<string, DateAvailability>>(new Map());
  const [loading, setLoading] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const nights = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0;
  const pricePerNight = service.pricePerNight || service.price || 0;
  const unitLabel = service.unitType || "room";
  const maxUnits = service.totalUnits || 1;

  /* ─── Fetch availability for visible month ───────────────────────────────── */
  const fetchAvailability = useCallback(async () => {
    const startDate = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-01`;
    const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
    const endDate = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    setLoading(true);
    try {
      const data = await api.get<{ availability: DateAvailability[] }>(
        `/bookings/date-availability?serviceId=${service._id}&startDate=${startDate}&endDate=${endDate}`,
      );
      const avArr = Array.isArray(data) ? data : (data?.availability || []);
      const map = new Map<string, DateAvailability>();
      for (const a of avArr) map.set(a.date, a);
      setAvailability((prev) => {
        const merged = new Map(prev);
        for (const [k, v] of map) merged.set(k, v);
        return merged;
      });
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [viewMonth.year, viewMonth.month, service._id]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  /* ─── Date selection logic ───────────────────────────────────────────────── */
  const handleSelect = (date: string) => {
    if (!checkIn || (checkIn && checkOut) || date <= checkIn) {
      // Start fresh - set check-in
      onCheckInChange(date);
      onCheckOutChange("");
    } else {
      // Set check-out
      onCheckOutChange(date);
    }
  };

  /* ─── Navigation ─────────────────────────────────────────────────────────── */
  const goNext = () => {
    setViewMonth((p) => {
      const m = p.month + 1;
      return m > 11 ? { year: p.year + 1, month: 0 } : { ...p, month: m };
    });
  };
  const goPrev = () => {
    const now = new Date();
    setViewMonth((p) => {
      const m = p.month - 1;
      const next = m < 0 ? { year: p.year - 1, month: 11 } : { ...p, month: m };
      // Don't go before current month
      if (next.year < now.getFullYear() || (next.year === now.getFullYear() && next.month < now.getMonth())) return p;
      return next;
    });
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={container}
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-white text-sm font-bold">
          2
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Select Dates</h2>
          <p className="text-xs text-muted-foreground">
            Pick check-in & check-out dates
            {service.checkInTime && ` · Check-in: ${service.checkInTime}`}
            {service.checkOutTime && ` · Check-out: ${service.checkOutTime}`}
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-2xl border bg-white p-6 space-y-6"
      >
        {/* ─── Selected dates summary ────────────────────────────────────── */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/20 p-4 border">
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Check-in</p>
            <p className={cn("text-sm font-bold", checkIn ? "text-foreground" : "text-muted-foreground")}>
              {checkIn ? toLabel(checkIn) : "Select date"}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3">
            <Moon className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">{nights || "—"}</span>
            <span className="text-[10px] text-muted-foreground">night{nights !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Check-out</p>
            <p className={cn("text-sm font-bold", checkOut ? "text-foreground" : "text-muted-foreground")}>
              {checkOut ? toLabel(checkOut) : "Select date"}
            </p>
          </div>
        </div>

        {/* ─── Calendar navigation ───────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-bold flex items-center gap-2">
            {monthLabel(viewMonth.year, viewMonth.month)}
            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* ─── Calendar grid ─────────────────────────────────────────────── */}
        <CalendarMonth
          year={viewMonth.year}
          month={viewMonth.month}
          checkIn={checkIn}
          checkOut={checkOut}
          availability={availability}
          numberOfUnits={numberOfUnits}
          onSelect={handleSelect}
        />

        {/* ─── Availability legend ───────────────────────────────────────── */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Limited</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Full</span>
        </div>

        {/* ─── Unit selector ─────────────────────────────────────────────── */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5" />
            Number of {unitLabel}s
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border"
              onClick={() => onUnitsChange(Math.max(1, numberOfUnits - 1))}
              disabled={numberOfUnits <= 1}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-bold w-6 text-center">{numberOfUnits}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border"
              onClick={() => onUnitsChange(Math.min(maxUnits, numberOfUnits + 1))}
              disabled={numberOfUnits >= maxUnits}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ─── Price preview ─────────────────────────────────────────────── */}
        {nights > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl bg-primary/5 border border-primary/15 p-4 space-y-2"
          >
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(pricePerNight)} × {nights} night{nights !== 1 ? "s" : ""} × {numberOfUnits} {unitLabel}{numberOfUnits !== 1 ? "s" : ""}</span>
              <span className="font-medium text-foreground">{formatCurrency(pricePerNight * nights * numberOfUnits)}</span>
            </div>
            {service.amenities && service.amenities.length > 0 && (
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground mt-1">
                <Info className="h-3 w-3 shrink-0 mt-0.5" />
                <span>Includes: {service.amenities.join(", ")}</span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.section>
  );
}
