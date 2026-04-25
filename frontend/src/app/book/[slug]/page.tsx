"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Monitor,
  Timer,
  CreditCard,
  Star,
  MapPin,
  Check,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRazorpay } from "@/hooks/use-razorpay";
import { getCoverImage } from "@/lib/category-images";
import { formatCurrency, formatTime } from "@/lib/utils";
import type {
  Tenant,
  Service,
  SlotView,
  DurationOption,
  RazorpayOrder,
  DateAvailability,
} from "@/lib/types";
import "../booking-page.css";

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function dateRange(days: number): Date[] {
  const arr: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    arr.push(d);
  }
  return arr;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short" });
}

function isToday(d: Date): boolean {
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

/**
 * Bucket a slot's start time into a time-of-day period.
 * 5–11:59 → morning, 12–16:59 → afternoon, 17–20:59 → evening, else night.
 */
type TimePeriod = "morning" | "afternoon" | "evening" | "night";
function getTimePeriod(startTime: string): TimePeriod {
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

const PERIOD_META: Record<TimePeriod, { label: string; range: string; Icon: typeof Sunrise }> = {
  morning: { label: "Morning", range: "Before 12 PM", Icon: Sunrise },
  afternoon: { label: "Afternoon", range: "12 – 5 PM", Icon: Sun },
  evening: { label: "Evening", range: "5 – 9 PM", Icon: Sunset },
  night: { label: "Night", range: "After 9 PM", Icon: Moon },
};
const PERIOD_ORDER: TimePeriod[] = ["morning", "afternoon", "evening", "night"];

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openCheckout } = useRazorpay();

  // ── Core data ────────────────────────────────────────────
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Wizard state ────────────────────────────────────────
  const [step, setStep] = useState(1);

  // Step 1 — Schedule
  const dates = useMemo(() => dateRange(14), []);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState<SlotView | null>(null);
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Step 2 — Experience
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [numberOfPersons, setNumberOfPersons] = useState<number>(1);

  // Date-range mode
  const [dateRangeAvail, setDateRangeAvail] = useState<DateAvailability[]>([]);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState(1);

  // Step 3 — Confirm
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    ref: string;
    id: string;
  } | null>(null);

  // ── Load tenant + services ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const t = await api.get<Tenant>(`/shop/by-slug/${slug}`);
        setTenant(t);
        api.setTenantId(t._id);
        const svc = await api.get<Service[]>(`/services`);
        setServices(Array.isArray(svc) ? svc : []);
        const list = Array.isArray(svc) ? svc : [];
        if (list.length > 0) {
          setSelectedService(list[0]);
          setDuration(list[0].defaultDuration || 60);
          setNumberOfPersons(list[0].minPersons || 1);
        }
      } catch {
        setError("Business not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // ── Load slots when date or service changes (slot mode) ─
  useEffect(() => {
    if (!tenant || !selectedService || selectedService.bookingMode === "date-range") return;
    (async () => {
      setSlotsLoading(true);
      try {
        const dateStr = toDateStr(selectedDate);
        const resp = await api.get<{ slots: SlotView[] }>(
          `/bookings/availability?serviceId=${selectedService._id}&date=${dateStr}&duration=${duration}&numberOfPersons=${numberOfPersons}`
        );
        setSlots(resp?.slots ?? (Array.isArray(resp) ? resp : []));
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [tenant, selectedService, selectedDate, duration, numberOfPersons]);

  // ── Load date availability (date-range mode) ────────────
  useEffect(() => {
    if (!tenant || !selectedService || selectedService.bookingMode !== "date-range") return;
    (async () => {
      try {
        const resp = await api.get<DateAvailability[]>(
          `/bookings/date-availability?serviceId=${selectedService._id}`
        );
        setDateRangeAvail(Array.isArray(resp) ? resp : []);
      } catch {
        setDateRangeAvail([]);
      }
    })();
  }, [tenant, selectedService]);

  // ── Step helpers ────────────────────────────────────────
  const isDateRange = selectedService?.bookingMode === "date-range";

  const canProceedStep1 = isDateRange
    ? checkInDate && checkOutDate
    : !!selectedSlot;

  const canProceedStep2 = !!selectedService && (isDateRange ? numberOfUnits >= 1 : duration > 0 && numberOfPersons >= 1);

  const totalPrice = useMemo(() => {
    if (!selectedService) return 0;
    if (isDateRange) {
      const nights =
        checkInDate && checkOutDate
          ? Math.max(
              1,
              Math.ceil(
                (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
                  86400000
              )
            )
          : 1;
      return (selectedService.pricePerNight ?? selectedService.price) * nights * numberOfUnits;
    }
    // Slot mode
    const durationOpt = selectedService.durationOptions?.find(
      (o) => o.minutes === duration
    );
    const basePrice = durationOpt?.price ?? selectedService.price;
    const extraPersonPrice =
      numberOfPersons > 1
        ? (numberOfPersons - 1) * (selectedService.pricePerAdditionalPerson || 0)
        : 0;
    return basePrice + extraPersonPrice;
  }, [selectedService, duration, numberOfPersons, isDateRange, checkInDate, checkOutDate, numberOfUnits]);

  // ── Booking submission ──────────────────────────────────
  const handleBook = async () => {
    if (!tenant || !selectedService || !isAuthenticated) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/book/${slug}`);
        return;
      }
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      let body: Record<string, any>;
      if (isDateRange) {
        body = {
          serviceId: selectedService._id,
          checkInDate,
          checkOutDate,
          numberOfUnits,
          customerNotes: notes,
        };
      } else {
        body = {
          serviceId: selectedService._id,
          date: toDateStr(selectedDate),
          startTime: selectedSlot!.startTime,
          duration,
          numberOfPersons,
          customerNotes: notes,
        };
      }

      const res = await api.post<any>(`/bookings`, body);
      const booking = res?.booking ?? res;

      // Check if payment is required (Razorpay)
      if (res?.razorpayOrder) {
        const order = res.razorpayOrder as RazorpayOrder;
        openCheckout({
          orderId: order.orderId,
          amount: order.amount,
          currency: order.currency,
          keyId: order.keyId,
          bookingRef: order.bookingRef,
          customerName: user?.name,
          customerEmail: user?.email,
          customerPhone: user?.phone,
          businessName: tenant.name,
          onSuccess: async (paymentResp) => {
            try {
              await api.post(`/payments/verify`, {
                razorpay_order_id: paymentResp.razorpay_order_id,
                razorpay_payment_id: paymentResp.razorpay_payment_id,
                razorpay_signature: paymentResp.razorpay_signature,
              });
              setBookingSuccess({
                ref: booking.bookingRef || booking._id,
                id: booking._id,
              });
            } catch {
              setError("Payment verification failed. Contact support.");
            }
            setSubmitting(false);
          },
          onFailure: () => {
            setError("Payment failed. Please try again.");
            setSubmitting(false);
          },
          onDismiss: () => setSubmitting(false),
        });
        return;
      }

      // No payment required
      setBookingSuccess({
        ref: booking.bookingRef || booking._id,
        id: booking._id,
      });
    } catch (err: any) {
      setError(err.message ?? "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step definitions for progress bar ──────────────────
  const stepDefs = [
    { num: 1, label: "Schedule", desc: "Pick date & time" },
    { num: 2, label: "Experience", desc: "Customize session" },
    { num: 3, label: "Confirm", desc: "Review & book" },
  ];

  /* ═════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════ */

  if (loading || authLoading) {
    return (
      <div className="bp-page">
        <div className="bp-bg-effects">
          <div className="bp-bg-orb bp-bg-orb-1" />
          <div className="bp-bg-orb bp-bg-orb-2" />
          <div className="bp-bg-orb bp-bg-orb-3" />
          <div className="bp-bg-grid" />
        </div>
        <div className="bp-container">
          <div className="bp-loading">
            <div className="bp-loader">
              <div className="bp-loader-ring" />
              <div className="bp-loader-ring" />
              <div className="bp-loader-ring" />
            </div>
            <span className="bp-loading-text">Loading booking experience…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="bp-page">
        <div className="bp-container" style={{ paddingTop: 100, textAlign: "center" }}>
          <h2 style={{ color: "var(--bp-error)" }}>{error}</h2>
          <button
            className="bp-primary-btn"
            style={{ marginTop: 24 }}
            onClick={() => router.push("/")}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  /* ── Success Modal ─── */
  if (bookingSuccess) {
    return (
      <div className="bp-page">
        <div className="bp-bg-effects">
          <div className="bp-bg-orb bp-bg-orb-1" />
          <div className="bp-bg-orb bp-bg-orb-2" />
          <div className="bp-bg-orb bp-bg-orb-3" />
          <div className="bp-bg-grid" />
        </div>
        <div className="bp-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
          <motion.div
            className="bp-card"
            style={{ maxWidth: 480, width: "100%", textAlign: "center", padding: "48px 32px" }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 250 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15, damping: 12 }}
              style={{
                width: 80,
                height: 80,
                margin: "0 auto 24px",
                borderRadius: "50%",
                background: "var(--bp-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 30px rgba(255,107,53,0.3)",
              }}
            >
              <Check size={40} color="white" />
            </motion.div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 8, background: "var(--bp-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Booking Confirmed!
            </h2>
            <p style={{ color: "var(--bp-gray-600)", marginBottom: 24 }}>
              Your session is booked. Get ready!
            </p>
            <div style={{ background: "var(--bp-gray-100)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--bp-gray-600)", fontSize: "0.85rem" }}>Booking Ref</span>
                <span style={{ fontWeight: 700, color: "var(--bp-primary)" }}>#{bookingSuccess.ref}</span>
              </div>
              {selectedService && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "var(--bp-gray-600)", fontSize: "0.85rem" }}>Service</span>
                  <span style={{ fontWeight: 600 }}>{selectedService.name}</span>
                </div>
              )}
              {!isDateRange && selectedSlot && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "var(--bp-gray-600)", fontSize: "0.85rem" }}>Date</span>
                    <span style={{ fontWeight: 600 }}>{selectedDate.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "var(--bp-gray-600)", fontSize: "0.85rem" }}>Time</span>
                    <span style={{ fontWeight: 600 }}>{formatTime(selectedSlot.startTime)} – {formatTime(computeEndTime(selectedSlot.startTime, duration))}</span>
                  </div>
                </>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--bp-gray-600)", fontSize: "0.85rem" }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--bp-primary)" }}>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
            <button
              className="bp-primary-btn"
              style={{ width: "100%", padding: "16px" }}
              onClick={() => router.push("/")}
            >
              Back to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Main booking page ─── */
  return (
    <div className="bp-page">
      {/* Background */}
      <div className="bp-bg-effects">
        <div className="bp-bg-orb bp-bg-orb-1" />
        <div className="bp-bg-orb bp-bg-orb-2" />
        <div className="bp-bg-orb bp-bg-orb-3" />
        <div className="bp-bg-grid" />
      </div>

      <div className="bp-container">
        {/* Cover image banner */}
        {tenant && (
          <div
            className="relative rounded-3xl overflow-hidden mb-6 shadow-lg"
            style={{ aspectRatio: "16 / 6", maxHeight: 280 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getCoverImage(tenant)}
              alt={tenant.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end gap-4">
              <div
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl ring-4 ring-white/50 flex items-center justify-center shrink-0 overflow-hidden"
              >
                {tenant.branding?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.branding.logo}
                    alt={tenant.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-violet-500 to-indigo-600 bg-clip-text text-transparent">
                    {tenant.name?.charAt(0)?.toUpperCase() ?? "B"}
                  </span>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md truncate">
                  {tenant.name}
                </h2>
                {tenant.category && (
                  <p className="text-xs sm:text-sm text-white/85 capitalize drop-shadow">
                    {tenant.category.replace(/-/g, " ")}
                    {tenant.address?.city ? ` · ${tenant.address.city}` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="bp-hero">
          <div className="bp-hero-badge">
            <Star size={16} />
            {tenant?.name ?? "Book Now"}
          </div>
          <h1 className="bp-hero-title">Book Your Experience</h1>
          <p className="bp-hero-subtitle">
            {tenant?.description ? tenant.description.slice(0, 80) : "Select your preferred time and enjoy your session"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bp-steps">
          {stepDefs.map((s, i) => (
            <React.Fragment key={s.num}>
              <div
                className={`bp-step-item${step >= s.num ? " active" : ""}${step > s.num ? " completed" : ""}`}
              >
                <div className="bp-step-num">
                  {step > s.num ? <Check size={16} /> : s.num}
                </div>
                <div className="bp-step-content">
                  <span className="bp-step-label">{s.label}</span>
                  <span className="bp-step-desc">{s.desc}</span>
                </div>
              </div>
              {i < stepDefs.length - 1 && (
                <div className="bp-step-connector">
                  <div className="bp-connector-line">
                    <motion.div
                      className="bp-connector-fill"
                      initial={{ width: 0 }}
                      animate={{ width: step > s.num ? "100%" : "0%" }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "2px solid rgba(239,68,68,0.3)",
              borderRadius: 16,
              padding: "14px 20px",
              color: "var(--bp-error)",
              fontWeight: 600,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            ⚠️ {error}
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--bp-error)", fontWeight: 700, fontSize: "1.1rem" }}
            >
              ×
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ═══════════════ STEP 1: SCHEDULE ═══════════════ */}
          {step === 1 && (
            <motion.div
              key="step1"
              className="bp-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.35 }}
            >
              <div className="bp-card-header">
                <div className="bp-card-icon">
                  <Calendar size={22} />
                </div>
                <div className="bp-card-header-text">
                  <h2 className="bp-card-title">
                    {isDateRange ? "Select Dates" : "Choose Your Schedule"}
                  </h2>
                  <p className="bp-card-subtitle">
                    {isDateRange
                      ? "Pick check-in and check-out dates"
                      : "Select your preferred date and time slot"}
                  </p>
                </div>
              </div>

              {/* Service selector if multiple */}
              {services.length > 1 && (
                <div className="bp-option-section" style={{ paddingTop: 20 }}>
                  <div className="bp-option-label">
                    <Monitor size={14} /> Service
                  </div>
                  <div className="bp-devices-grid" style={{ padding: 0 }}>
                    {services.map((svc) => (
                      <div
                        key={svc._id}
                        className={`bp-device-card${selectedService?._id === svc._id ? " selected" : ""}`}
                        onClick={() => {
                          setSelectedService(svc);
                          setDuration(svc.defaultDuration || 60);
                          setNumberOfPersons(svc.minPersons || 1);
                          setSelectedSlot(null);
                          setSlots([]);
                        }}
                      >
                        <div className="bp-device-header">
                          <div className="bp-device-icon">
                            {svc.images?.[0] ? (
                              <img
                                src={svc.images[0]}
                                alt={svc.name}
                                style={{ width: 48, height: 48, borderRadius: 14, objectFit: "cover" }}
                              />
                            ) : (
                              "🎮"
                            )}
                          </div>
                          <div className="bp-device-details">
                            <h4 className="bp-device-name">{svc.name}</h4>
                            <p className="bp-device-meta">
                              {formatCurrency(svc.price)} · {svc.maxPersons} max
                            </p>
                          </div>
                        </div>
                        {selectedService?._id === svc._id && (
                          <div className="bp-device-selected-badge">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isDateRange ? (
                /* ── Date-range picker ── */
                <div style={{ padding: "20px 28px 28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--bp-gray-600)", display: "block", marginBottom: 6 }}>Check-in</label>
                      <input
                        type="date"
                        value={checkInDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => {
                          setCheckInDate(e.target.value);
                          if (checkOutDate && e.target.value >= checkOutDate) setCheckOutDate("");
                        }}
                        style={{ width: "100%", padding: "12px 14px", border: "2px solid var(--bp-gray-200)", borderRadius: 12, fontSize: "0.95rem", outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--bp-gray-600)", display: "block", marginBottom: 6 }}>Check-out</label>
                      <input
                        type="date"
                        value={checkOutDate}
                        min={checkInDate || new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        style={{ width: "100%", padding: "12px 14px", border: "2px solid var(--bp-gray-200)", borderRadius: 12, fontSize: "0.95rem", outline: "none" }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Date Strip ── */}
                  <div className="bp-date-strip">
                    {dates.map((d) => {
                      const active = toDateStr(d) === toDateStr(selectedDate);
                      const today = isToday(d);
                      return (
                        <button
                          key={toDateStr(d)}
                          className={`bp-date-btn${active ? " active" : ""}${today ? " today" : ""}`}
                          onClick={() => {
                            setSelectedDate(d);
                            setSelectedSlot(null);
                          }}
                        >
                          <span className="bp-date-day">{dayLabel(d)}</span>
                          <span className="bp-date-num">{d.getDate()}</span>
                          <span className="bp-date-month">{monthLabel(d)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Time Slots Grid ── */}
                  <div className="bp-slots-header">
                    <div className="bp-slots-header-left">
                      <div className="bp-slots-icon">
                        <Clock size={22} />
                      </div>
                      <div>
                        <h3 className="bp-slots-title">Available Time Slots</h3>
                        <p className="bp-slots-subtitle">
                          {selectedDate.toLocaleDateString("en-IN", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="bp-legend">
                      <span className="bp-legend-chip bp-legend-available">
                        <span className="bp-legend-dot" />
                        <span className="bp-legend-label">Open</span>
                      </span>
                      <span className="bp-legend-chip bp-legend-filling">
                        <span className="bp-legend-dot" />
                        <span className="bp-legend-label">Filling</span>
                      </span>
                      <span className="bp-legend-chip bp-legend-full">
                        <span className="bp-legend-dot" />
                        <span className="bp-legend-label">Full</span>
                      </span>
                    </div>
                  </div>

                  {slotsLoading ? (
                    <div className="bp-loading" style={{ padding: "40px 20px" }}>
                      <div className="bp-loader">
                        <div className="bp-loader-ring" />
                        <div className="bp-loader-ring" />
                        <div className="bp-loader-ring" />
                      </div>
                      <span className="bp-loading-text">Loading slots…</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="bp-empty-state">
                      <span className="bp-empty-icon">📅</span>
                      <span className="bp-empty-text">No slots available</span>
                      <span className="bp-empty-hint">Try another date or service</span>
                    </div>
                  ) : (
                    <div className="bp-slots-periods">
                      {PERIOD_ORDER.map((period) => {
                        const periodSlots = slots.filter((s) => getTimePeriod(s.startTime) === period);
                        if (periodSlots.length === 0) return null;
                        const meta = PERIOD_META[period];
                        const Icon = meta.Icon;
                        const availableCount = periodSlots.filter(
                          (s) => s.status !== "full" && s.status !== "blocked" && s.canBook,
                        ).length;

                        return (
                          <div key={period} className={`bp-period bp-period-${period}`}>
                            <div className="bp-period-header">
                              <div className="bp-period-icon">
                                <Icon size={18} />
                              </div>
                              <div className="bp-period-text">
                                <h4 className="bp-period-label">{meta.label}</h4>
                                <span className="bp-period-range">{meta.range}</span>
                              </div>
                              <span className="bp-period-count">
                                {availableCount > 0
                                  ? `${availableCount} ${availableCount === 1 ? "slot" : "slots"}`
                                  : "All booked"}
                              </span>
                            </div>

                            <div className="bp-slots-grid bp-slots-grid-period">
                              {periodSlots.map((slot) => {
                                const isSelected = selectedSlot?.slotId === slot.slotId;
                                const isFull = slot.status === "full";
                                const isBlocked = slot.status === "blocked";
                                const disabled = isFull || isBlocked || !slot.canBook;

                                let stateClass = "bp-slot-available";
                                if (slot.status === "filling") stateClass = "bp-slot-filling";
                                if (isFull) stateClass = "bp-slot-full";
                                if (isBlocked) stateClass = "bp-slot-blocked";

                                const label =
                                  isFull
                                    ? "Full"
                                    : isBlocked
                                    ? "Closed"
                                    : slot.status === "filling"
                                    ? `${slot.availablePlayers} left`
                                    : `${slot.availablePlayers} open`;

                                return (
                                  <motion.button
                                    key={slot.slotId}
                                    className={`bp-slot ${stateClass}${isSelected ? " bp-slot-selected" : ""}`}
                                    disabled={disabled}
                                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                    whileHover={!disabled ? { scale: 1.05, y: -2 } : undefined}
                                    whileTap={!disabled ? { scale: 0.96 } : undefined}
                                  >
                                    {isSelected && (
                                      <span className="bp-slot-check">
                                        <Check size={12} />
                                      </span>
                                    )}
                                    {!isSelected && <span className="bp-slot-dot" />}
                                    <span className="bp-slot-time">{formatTime(slot.startTime)}</span>
                                    <span className="bp-slot-label">{label}</span>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ═══════════════ STEP 2: EXPERIENCE ═══════════════ */}
          {step === 2 && (
            <motion.div
              key="step2"
              className="bp-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.35 }}
            >
              <div className="bp-card-header">
                <button className="bp-back-btn" onClick={() => setStep(1)}>
                  <ArrowLeft size={18} />
                </button>
                <div className="bp-card-icon">
                  <Timer size={22} />
                </div>
                <div className="bp-card-header-text">
                  <h2 className="bp-card-title">Customize Experience</h2>
                  <p className="bp-card-subtitle">
                    {isDateRange
                      ? "How many units would you like?"
                      : "Choose duration and number of persons"}
                  </p>
                </div>
                {/* Session badges */}
                {!isDateRange && selectedSlot && (
                  <div className="bp-session-badges">
                    <div className="bp-session-badge">
                      <Calendar size={16} />
                      <div className="bp-badge-content">
                        <span className="bp-badge-label">Date</span>
                        <span className="bp-badge-value">
                          {selectedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="bp-session-badge">
                      <Clock size={16} />
                      <div className="bp-badge-content">
                        <span className="bp-badge-label">Time</span>
                        <span className="bp-badge-value">{formatTime(selectedSlot.startTime)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isDateRange ? (
                /* Units for date-range */
                <div className="bp-option-section" style={{ paddingTop: 24 }}>
                  <div className="bp-option-label">
                    <Monitor size={14} /> Number of {selectedService?.unitType || "Units"}
                  </div>
                  <div className="bp-players-row">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        className={`bp-player-btn${numberOfUnits === n ? " active" : ""}`}
                        onClick={() => setNumberOfUnits(n)}
                        disabled={n > (selectedService?.totalUnits ?? 10)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Duration pills */}
                  {selectedService?.durationOptions && selectedService.durationOptions.length > 0 && (
                    <div className="bp-option-section" style={{ paddingTop: 24 }}>
                      <div className="bp-option-label">
                        <Timer size={14} /> Session Duration
                      </div>
                      <div className="bp-duration-grid">
                        {selectedService.durationOptions.map((opt) => (
                          <button
                            key={opt.minutes}
                            className={`bp-duration-pill${duration === opt.minutes ? " active" : ""}`}
                            onClick={() => setDuration(opt.minutes)}
                          >
                            <span className="bp-duration-time">{opt.label || `${opt.minutes} min`}</span>
                            <span className="bp-duration-price">{formatCurrency(opt.price)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Number of persons */}
                  <div className="bp-option-section">
                    <div className="bp-option-label">
                      <Users size={14} /> Number of Players
                    </div>
                    <div className="bp-players-row">
                      {Array.from(
                        { length: (selectedService?.maxPersons ?? 4) - (selectedService?.minPersons ?? 1) + 1 },
                        (_, i) => (selectedService?.minPersons ?? 1) + i
                      ).map((n) => (
                        <button
                          key={n}
                          className={`bp-player-btn${numberOfPersons === n ? " active" : ""}`}
                          onClick={() => setNumberOfPersons(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Price preview */}
              <div className="bp-option-section">
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,153,102,0.04))",
                    border: "1.5px solid rgba(255,107,53,0.15)",
                    borderRadius: 16,
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CreditCard size={18} color="var(--bp-primary)" />
                    <span style={{ fontWeight: 600, color: "var(--bp-gray-700)" }}>Estimated Price</span>
                  </div>
                  <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--bp-primary)" }}>
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ STEP 3: CONFIRM ═══════════════ */}
          {step === 3 && (
            <motion.div
              key="step3"
              className="bp-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.35 }}
            >
              <div className="bp-card-header">
                <button className="bp-back-btn" onClick={() => setStep(2)}>
                  <ArrowLeft size={18} />
                </button>
                <div className="bp-card-icon">
                  <CheckCircle size={22} />
                </div>
                <div className="bp-card-header-text">
                  <h2 className="bp-card-title">Review & Confirm</h2>
                  <p className="bp-card-subtitle">Double check your booking details</p>
                </div>
              </div>

              {/* Summary */}
              <div style={{ padding: "24px 28px" }}>
                <div
                  style={{
                    background: "var(--bp-gray-100)",
                    borderRadius: 20,
                    padding: "24px 24px",
                  }}
                >
                  <div className="bp-summary-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bp-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Service</div>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>{selectedService?.name}</div>
                    </div>
                    {!isDateRange && selectedSlot && (
                      <>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bp-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Date</div>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                            {selectedDate.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bp-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Time</div>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                            {formatTime(selectedSlot.startTime)} – {formatTime(computeEndTime(selectedSlot.startTime, duration))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bp-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Duration</div>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{duration} min</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bp-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Players</div>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                            {numberOfPersons} {numberOfPersons === 1 ? "person" : "people"}
                          </div>
                        </div>
                      </>
                    )}
                    {isDateRange && (
                      <>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bp-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Check-in</div>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{checkInDate}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bp-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Check-out</div>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{checkOutDate}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bp-gray-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Units</div>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{numberOfUnits}</div>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ margin: "20px 0", height: 1, background: "var(--bp-gray-300)" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--bp-gray-700)" }}>Total Amount</span>
                    <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--bp-primary)" }}>
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginTop: 24 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--bp-gray-600)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                    Special Requests (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes…"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "2px solid var(--bp-gray-200)",
                      borderRadius: 14,
                      fontSize: "0.95rem",
                      resize: "vertical",
                      outline: "none",
                      fontFamily: "inherit",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--bp-primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--bp-gray-200)")}
                  />
                </div>

                {/* Login prompt */}
                {!isAuthenticated && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: "16px 20px",
                      background: "rgba(255,107,53,0.08)",
                      border: "2px solid rgba(255,107,53,0.2)",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Users size={20} color="var(--bp-primary)" />
                    <div>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>Login required to book</p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--bp-gray-600)" }}>
                        <a
                          href={`/login?redirect=/book/${slug}`}
                          style={{ color: "var(--bp-primary)", fontWeight: 600, textDecoration: "underline" }}
                        >
                          Sign in
                        </a>{" "}
                        or{" "}
                        <a
                          href={`/register?redirect=/book/${slug}`}
                          style={{ color: "var(--bp-primary)", fontWeight: 600, textDecoration: "underline" }}
                        >
                          create an account
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════ FLOATING FOOTER ═══════════════ */}
        <div className="bp-footer">
          <div className="bp-footer-inner">
            <div className="bp-footer-info">
              <span className="bp-footer-price">{formatCurrency(totalPrice)}</span>
              <span className="bp-footer-detail">
                {!isDateRange && selectedSlot
                  ? `${formatTime(selectedSlot.startTime)} · ${duration}min · ${numberOfPersons}p`
                  : isDateRange && checkInDate
                  ? `${checkInDate} → ${checkOutDate || "…"} · ${numberOfUnits} unit(s)`
                  : "Select a time slot"}
              </span>
            </div>

            {step === 1 && (
              <button
                className="bp-primary-btn"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Next <ArrowRight size={16} />
              </button>
            )}
            {step === 2 && (
              <button
                className="bp-primary-btn"
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
              >
                Review <ArrowRight size={16} />
              </button>
            )}
            {step === 3 && (
              <button
                className="bp-primary-btn"
                disabled={submitting || !isAuthenticated}
                onClick={handleBook}
              >
                {submitting ? "Booking…" : "Confirm Booking"}{" "}
                {!submitting && <CheckCircle size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
