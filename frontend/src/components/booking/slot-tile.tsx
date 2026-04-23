"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Clock, Flame } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import type { Service, SlotView, SlotStatus } from "@/lib/types";

interface SlotTileProps {
  slot: SlotView;
  selected: boolean;
  inSelection: boolean;
  canSelect: boolean;
  isHovered: boolean;
  service?: Service;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

const statusMeta: Record<
  SlotStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  available: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  filling: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  full: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  blocked: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-400",
    dot: "bg-gray-400",
  },
};

function CapacityBar({ pct, status }: { pct: number; status: SlotStatus }) {
  const colors: Record<SlotStatus, string> = {
    available: "bg-emerald-500",
    filling: "bg-amber-500",
    full: "bg-red-500",
    blocked: "bg-gray-300",
  };
  return (
    <div className="absolute inset-x-2 bottom-2 h-1 rounded-full bg-gray-100 overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", colors[status])}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function StatusLabel({ slot }: { slot: SlotView }) {
  const { status } = slot;
  const pct = slot.maxPlayers > 0
    ? Math.round((slot.bookedPlayers / slot.maxPlayers) * 100)
    : 0;
  if (status === "full") return <>Full</>;
  if (status === "blocked") return <>—</>;
  if (status === "filling") return <>{pct}%</>;
  return <>{slot.availablePlayers}/{slot.maxPlayers}</>;
}

export function SlotTile({
  slot,
  selected,
  inSelection,
  canSelect,
  isHovered,
  service,
  onClick,
  onHover,
}: SlotTileProps) {
  const disabled = !canSelect && !inSelection;
  const meta = statusMeta[slot.status];
  const pct = slot.maxPlayers > 0
    ? Math.round((slot.bookedPlayers / slot.maxPlayers) * 100)
    : 0;

  const Icon =
    slot.status === "full" ? Lock :
    slot.status === "blocked" ? Clock :
    slot.status === "filling" ? Flame :
    null;

  return (
    <motion.button
      type="button"
      layout
      onClick={() => !disabled && onClick()}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${formatTime(slot.startTime)} to ${formatTime(slot.endTime)}, ${slot.status}, ${pct}% booked`}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      animate={{ scale: selected ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={cn(
        "group relative h-24 rounded-xl overflow-hidden text-left",
        "border bg-white transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        meta.border,
        selected && [
          "ring-2 ring-primary border-primary",
          "shadow-md",
          "bg-primary/5",
        ],
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && !selected && "hover:shadow-md cursor-pointer",
      )}
    >
      {/* selected corner check */}
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="absolute top-2 right-2 z-20 h-5 w-5 rounded-full flex items-center justify-center bg-primary text-white"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>

      {/* status dot + icon */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
        <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
        {Icon && !selected && (
          <Icon className={cn("h-3 w-3", meta.text)} strokeWidth={2.5} />
        )}
      </div>

      {/* time */}
      <div className="absolute inset-x-3 top-8 z-10">
        <p className="font-mono text-[15px] font-semibold tabular-nums text-foreground tracking-tight">
          {formatTime(slot.startTime)}
        </p>
        <p className={cn("text-[10.5px] font-medium mt-0.5 tabular-nums", meta.text)}>
          <StatusLabel slot={slot} />
        </p>
      </div>

      {/* capacity bar */}
      {slot.status !== "blocked" && (
        <CapacityBar pct={pct} status={slot.status} />
      )}

      {/* tooltip */}
      <AnimatePresence>
        {isHovered && !selected && service && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none"
          >
            <div className="bg-white border rounded-lg shadow-lg px-3.5 py-2.5 text-xs whitespace-nowrap">
              <p className="font-semibold text-[13px] text-foreground">
                {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
              </p>
              <p className="text-muted-foreground mt-1">
                {slot.bookedPlayers}/{slot.maxPlayers} booked · {service.numberOfDevices} device(s)
              </p>
              <p className={cn("mt-1 font-medium", meta.text)}>
                {slot.status === "available" && "Open — book now"}
                {slot.status === "filling" && "Filling up fast"}
                {slot.status === "full" && "Fully booked"}
                {slot.status === "blocked" && "Not available"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
