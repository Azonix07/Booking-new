"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Monitor,
  Zap,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Check,
  RefreshCw,
  CreditCard,
  Moon,
  BedDouble,
} from "lucide-react";
import { cn, formatCurrency, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Service, SlotView } from "@/lib/types";

function getServiceIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("ps5") || lower.includes("ps4") || lower.includes("gaming") || lower.includes("xbox") || lower.includes("console"))
    return Gamepad2;
  if (lower.includes("vr") || lower.includes("virtual")) return Monitor;
  if (lower.includes("driv") || lower.includes("sim")) return Monitor;
  return Zap;
}

function getServiceGradient(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("ps5") || lower.includes("ps4") || lower.includes("gaming") || lower.includes("xbox"))
    return "from-blue-500 to-blue-600";
  if (lower.includes("vr") || lower.includes("virtual"))
    return "from-cyan-500 to-blue-600";
  if (lower.includes("driv") || lower.includes("sim"))
    return "from-orange-500 to-red-600";
  return "from-emerald-500 to-teal-600";
}

interface BookingSummaryProps {
  currentService: Service | undefined;
  selectedDate: string;
  selectedDuration: { minutes: number; label: string; price: number } | null;
  numberOfPersons: number;
  selectedSlots: string[];
  slots: SlotView[];
  totalPrice: number;
  bookingError: string;
  bookingSuccess: boolean;
  submitting: boolean;
  onBook: () => void;
  businessName: string;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function BookingSummary({
  currentService,
  selectedDate,
  selectedDuration,
  numberOfPersons,
  selectedSlots,
  slots,
  totalPrice,
  bookingError,
  bookingSuccess,
  submitting,
  onBook,
  businessName,
}: BookingSummaryProps) {
  const firstSelected = slots.find((s) => s.slotId === selectedSlots[0]);
  const lastSelected = slots.find((s) => s.slotId === selectedSlots[selectedSlots.length - 1]);
  const hasSlots = selectedSlots.length > 0;

  return (
    <aside className="lg:block">
      <div className="sticky top-20">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="relative overflow-hidden px-6 py-5 border-b border-border">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
            <div className="relative">
              <h3 className="font-bold text-base">Booking Summary</h3>
              {currentService && (
                <p className="text-xs text-muted-foreground mt-0.5">{businessName}</p>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {currentService ? (
              <>
                {/* Selected service */}
                <motion.div
                  initial={false}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg",
                    getServiceGradient(currentService.name),
                  )}>
                    {(() => { const Icon = getServiceIcon(currentService.name); return <Icon className="h-5 w-5" />; })()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{currentService.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentService.numberOfDevices} device(s) · {currentService.maxPlayersPerDevice} per device
                    </p>
                  </div>
                </motion.div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Detail rows */}
                <div className="space-y-3">
                  <SummaryRow
                    label="Date"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                      </span>
                    }
                  />
                  <SummaryRow
                    label="Duration"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {selectedDuration?.label || "—"}
                      </span>
                    }
                  />
                  <SummaryRow
                    label="Players"
                    value={
                      <span className="flex items-center gap-1.5">
                        {numberOfPersons}
                        <Users className="h-3 w-3 text-muted-foreground" />
                      </span>
                    }
                  />
                  <SummaryRow
                    label="Time"
                    value={
                      firstSelected && lastSelected ? (
                        <span className="font-semibold">{formatTime(firstSelected.startTime)} — {formatTime(lastSelected.endTime)}</span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Pick a slot</span>
                      )
                    }
                  />
                  {selectedSlots.length > 1 && (
                    <SummaryRow label="Slots" value={`${selectedSlots.length} consecutive`} />
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={totalPrice}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="text-2xl font-bold text-primary"
                    >
                      {formatCurrency(totalPrice)}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {bookingError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{bookingError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success */}
                <AnimatePresence>
                  {bookingSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                        <Check className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Payment successful! Booking confirmed. Check your bookings for details.</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className={cn(
                      "w-full h-13 text-sm font-bold rounded-xl transition-all duration-300",
                      hasSlots && !submitting
                        ? "bg-primary  text-white shadow-md hover:shadow-primary/15"
                        : "",
                    )}
                    size="lg"
                    disabled={!hasSlots || submitting}
                    onClick={onBook}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" /> Processing...
                      </span>
                    ) : !hasSlots ? (
                      "Select a time slot"
                    ) : (
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Pay & Book — {formatCurrency(totalPrice)}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <div className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <Gamepad2 className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Pick a device to get started</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </aside>
  );
}

/* ─── Mobile Floating CTA ──────────────────────────────────────────────────── */

export function MobileBookingBar({
  currentService,
  selectedDuration,
  numberOfPersons,
  totalPrice,
  firstSlot,
  lastSlot,
  submitting,
  onBook,
}: {
  currentService: Service;
  selectedDuration: { label: string } | null;
  numberOfPersons: number;
  totalPrice: number;
  firstSlot: SlotView | undefined;
  lastSlot: SlotView | undefined;
  submitting: boolean;
  onBook: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
      className="fixed bottom-0 inset-x-0 lg:hidden z-40 border-t border-border bg-white p-4 safe-area-bottom"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <p className="text-xs text-muted-foreground">
            {currentService.name} · {selectedDuration?.label} · {numberOfPersons} player(s)
          </p>
          <p className="text-xs font-medium mt-0.5">
            {firstSlot && lastSlot
              ? `${formatTime(firstSlot.startTime)} — ${formatTime(lastSlot.endTime)}`
              : ""}
          </p>
        </div>
        <span className="text-lg font-bold text-primary">
          {formatCurrency(totalPrice)}
        </span>
      </div>
      <Button
        className="w-full h-12 rounded-xl font-bold bg-primary  text-white shadow-md"
        disabled={submitting}
        onClick={onBook}
      >
        {submitting ? "Processing..." : `Pay & Book — ${formatCurrency(totalPrice)}`}
      </Button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DATE-RANGE BOOKING SUMMARY (rooms / hotels)
   ═══════════════════════════════════════════════════════════════════════════════ */

interface DateRangeBookingSummaryProps {
  currentService: Service | undefined;
  checkIn: string;
  checkOut: string;
  numberOfUnits: number;
  nights: number;
  totalPrice: number;
  bookingError: string;
  bookingSuccess: boolean;
  submitting: boolean;
  onBook: () => void;
  businessName: string;
}

function toLabel(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DateRangeBookingSummary({
  currentService,
  checkIn,
  checkOut,
  numberOfUnits,
  nights,
  totalPrice,
  bookingError,
  bookingSuccess,
  submitting,
  onBook,
  businessName,
}: DateRangeBookingSummaryProps) {
  const hasDates = !!(checkIn && checkOut && nights > 0);
  const unitLabel = currentService?.unitType || "room";

  return (
    <aside className="lg:block">
      <div className="sticky top-20">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="relative overflow-hidden px-6 py-5 border-b border-border">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
            <div className="relative">
              <h3 className="font-bold text-base">Booking Summary</h3>
              {currentService && (
                <p className="text-xs text-muted-foreground mt-0.5">{businessName}</p>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {currentService ? (
              <>
                {/* Selected service */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg",
                    getServiceGradient(currentService.name),
                  )}>
                    <BedDouble className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{currentService.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentService.totalUnits || 1} {unitLabel}(s) available
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Detail rows */}
                <div className="space-y-3">
                  <SummaryRow
                    label="Check-in"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {toLabel(checkIn)}
                      </span>
                    }
                  />
                  <SummaryRow
                    label="Check-out"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {toLabel(checkOut)}
                      </span>
                    }
                  />
                  <SummaryRow
                    label="Nights"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Moon className="h-3 w-3 text-muted-foreground" />
                        {nights || "—"}
                      </span>
                    }
                  />
                  <SummaryRow
                    label={`${unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)}(s)`}
                    value={numberOfUnits}
                  />
                  {currentService.checkInTime && (
                    <SummaryRow
                      label="Check-in time"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {currentService.checkInTime}
                        </span>
                      }
                    />
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={totalPrice}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="text-2xl font-bold text-primary"
                    >
                      {formatCurrency(totalPrice)}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {bookingError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{bookingError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success */}
                <AnimatePresence>
                  {bookingSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                        <Check className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Payment successful! Booking confirmed.</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className={cn(
                      "w-full h-13 text-sm font-bold rounded-xl transition-all duration-300",
                      hasDates && !submitting
                        ? "bg-primary  text-white shadow-md hover:shadow-primary/15"
                        : "",
                    )}
                    size="lg"
                    disabled={!hasDates || submitting}
                    onClick={onBook}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" /> Processing...
                      </span>
                    ) : !hasDates ? (
                      "Select check-in & check-out"
                    ) : (
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Pay & Book — {formatCurrency(totalPrice)}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <div className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <BedDouble className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Select a service to get started</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </aside>
  );
}

/* ─── Date-Range Mobile Floating CTA ───────────────────────────────────────── */

export function DateRangeMobileBar({
  currentService,
  nights,
  numberOfUnits,
  totalPrice,
  submitting,
  onBook,
}: {
  currentService: Service;
  nights: number;
  numberOfUnits: number;
  totalPrice: number;
  submitting: boolean;
  onBook: () => void;
}) {
  const unitLabel = currentService.unitType || "room";
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
      className="fixed bottom-0 inset-x-0 lg:hidden z-40 border-t border-border bg-white p-4 safe-area-bottom"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <p className="text-xs text-muted-foreground">
            {currentService.name} · {nights} night{nights !== 1 ? "s" : ""} · {numberOfUnits} {unitLabel}{numberOfUnits !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-lg font-bold text-primary">
          {formatCurrency(totalPrice)}
        </span>
      </div>
      <Button
        className="w-full h-12 rounded-xl font-bold bg-primary  text-white shadow-md"
        disabled={submitting}
        onClick={onBook}
      >
        {submitting ? "Processing..." : `Pay & Book — ${formatCurrency(totalPrice)}`}
      </Button>
    </motion.div>
  );
}
