"use client";

import { motion } from "framer-motion";
import { Check, Gamepad2, Monitor, Users, Zap, BedDouble, Volleyball, Scissors, PartyPopper, Briefcase } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Service } from "@/lib/types";

interface DeviceSelectorProps {
  services: Service[];
  selectedService: string;
  onSelect: (id: string) => void;
}

function getServiceIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("room") || lower.includes("suite") || lower.includes("hotel") || lower.includes("bed"))
    return BedDouble;
  if (lower.includes("turf") || lower.includes("court") || lower.includes("cricket") || lower.includes("football") || lower.includes("badminton") || lower.includes("tennis"))
    return Volleyball;
  if (lower.includes("salon") || lower.includes("hair") || lower.includes("spa") || lower.includes("manicure"))
    return Scissors;
  if (lower.includes("hall") || lower.includes("venue") || lower.includes("party") || lower.includes("terrace"))
    return PartyPopper;
  if (lower.includes("desk") || lower.includes("cabin") || lower.includes("meeting") || lower.includes("co-work"))
    return Briefcase;
  if (lower.includes("ps5") || lower.includes("ps4") || lower.includes("gaming") || lower.includes("xbox") || lower.includes("console"))
    return Gamepad2;
  if (lower.includes("vr") || lower.includes("virtual")) return Monitor;
  if (lower.includes("driv") || lower.includes("sim")) return Monitor;
  return Zap;
}

function getServiceGradient(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("room") || lower.includes("suite") || lower.includes("hotel") || lower.includes("bed"))
    return "from-sky-500 to-blue-600";
  if (lower.includes("turf") || lower.includes("court") || lower.includes("cricket") || lower.includes("football") || lower.includes("badminton"))
    return "from-emerald-500 to-green-600";
  if (lower.includes("hall") || lower.includes("venue") || lower.includes("party"))
    return "from-rose-500 to-pink-600";
  if (lower.includes("desk") || lower.includes("cabin") || lower.includes("co-work"))
    return "from-amber-500 to-orange-600";
  if (lower.includes("ps5") || lower.includes("ps4") || lower.includes("gaming") || lower.includes("xbox"))
    return "from-blue-500 to-blue-600";
  if (lower.includes("vr") || lower.includes("virtual"))
    return "from-cyan-500 to-blue-600";
  if (lower.includes("driv") || lower.includes("sim"))
    return "from-orange-500 to-red-600";
  return "from-emerald-500 to-teal-600";
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export function DeviceSelector({ services, selectedService, onSelect }: DeviceSelectorProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={container}
    >
      <motion.div variants={item} className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-white text-sm font-bold shadow-sm">
          1
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Choose Your Service</h2>
          <p className="text-xs text-muted-foreground">Select what you&apos;d like to book</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => {
          const Icon = getServiceIcon(svc.name);
          const gradient = getServiceGradient(svc.name);
          const isActive = selectedService === svc._id;

          return (
            <motion.button
              key={svc._id}
              variants={item}
              type="button"
              onClick={() => onSelect(svc._id)}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "group relative rounded-2xl text-left transition-all duration-300 overflow-hidden",
                isActive
                  ? "ring-2 ring-primary shadow-md"
                  : "ring-1 ring-border hover:ring-primary/50 hover:shadow-md",
              )}
            >
              {/* Glass background */}
              <div className={cn(
                "absolute inset-0 transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50",
              )}>
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", gradient)} />
              </div>

              <div className="relative p-5 bg-white border border-border">
                {/* Selected check */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/15"
                  >
                    <Check className="h-3.5 w-3.5 text-white" />
                  </motion.div>
                )}

                {/* Icon */}
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                  isActive
                    ? `bg-gradient-to-br ${gradient} text-white shadow-lg`
                    : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                )}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Name & Price */}
                <h3 className="font-bold text-base">{svc.name}</h3>
                <p className={cn(
                  "text-lg font-bold mt-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                )}>
                  {svc.bookingMode === "date-range"
                    ? formatCurrency(svc.pricePerNight || svc.price)
                    : formatCurrency(svc.price)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {svc.bookingMode === "date-range" ? "/night" : "/session"}
                  </span>
                </p>

                {/* Specs */}
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                  {svc.bookingMode === "date-range" ? (
                    <>
                      <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                        <BedDouble className="h-3 w-3" />{svc.totalUnits || 1} {svc.unitType || "room"}{(svc.totalUnits || 1) > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                        <Users className="h-3 w-3" />max {svc.maxPlayersPerDevice}/unit
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                        <Monitor className="h-3 w-3" />{svc.numberOfDevices} {svc.isExclusive ? "venue" : "device"}{svc.numberOfDevices > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                        <Users className="h-3 w-3" />{svc.maxPlayersPerDevice}/{svc.isExclusive ? "session" : "device"}
                      </span>
                      <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                        Max {svc.maxTotalPlayers}
                      </span>
                    </>
                  )}
                </div>

                {/* Glow line at bottom when active */}
                {isActive && (
                  <motion.div
                    layoutId="device-glow"
                    className={cn("absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r", gradient)}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
