"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Shield,
  Zap,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ArrowRight,
  Gamepad2,
  UtensilsCrossed,
  Dumbbell,
  Volleyball,
} from "lucide-react";

const TRUST_PILLS = [
  { icon: Shield, label: "Secure" },
  { icon: Zap, label: "Instant" },
  { icon: Clock, label: "24/7" },
  { icon: Calendar, label: "Real-time" },
];

type Slide =
  | {
      kind: "hero";
    }
  | {
      kind: "ad";
      badge: string;
      badgeIcon: React.ComponentType<{ className?: string }>;
      title: string;
      subtitle: string;
      cta: string;
      ctaHref: string;
      image: string;
      imageAlt: string;
      tint: string;
    }
  | {
      kind: "promote";
    };

// Unsplash CDN URLs — stable, licensed for broad use
const SLIDES: Slide[] = [
  { kind: "hero" },
  {
    kind: "ad",
    badge: "Sponsored",
    badgeIcon: Gamepad2,
    title: "Game nights just got serious",
    subtitle: "PS5, VR, sim rigs — book a station in seconds.",
    cta: "Explore gaming lounges",
    ctaHref: "/?category=gaming-lounge",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80&auto=format&fit=crop",
    imageAlt: "Gaming controller setup",
    tint: "from-violet-900/80 via-indigo-900/60 to-transparent",
  },
  {
    kind: "ad",
    badge: "Sponsored",
    badgeIcon: Volleyball,
    title: "Turf time, any time",
    subtitle: "Football, cricket, badminton — live availability across 500+ venues.",
    cta: "Find a turf near me",
    ctaHref: "/?category=turf",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&q=80&auto=format&fit=crop",
    imageAlt: "Football turf at night",
    tint: "from-emerald-900/80 via-teal-900/60 to-transparent",
  },
  {
    kind: "ad",
    badge: "Sponsored",
    badgeIcon: UtensilsCrossed,
    title: "Table for two, tonight at 8?",
    subtitle: "Skip the wait. Reserve in one tap at top-rated restaurants.",
    cta: "Browse restaurants",
    ctaHref: "/?category=restaurant",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&auto=format&fit=crop",
    imageAlt: "Restaurant interior",
    tint: "from-amber-900/80 via-orange-900/60 to-transparent",
  },
  {
    kind: "ad",
    badge: "Sponsored",
    badgeIcon: Dumbbell,
    title: "Sweat smarter, not longer",
    subtitle: "Trial class passes at premium gyms & studios.",
    cta: "Discover fitness",
    ctaHref: "/?category=fitness",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80&auto=format&fit=crop",
    imageAlt: "Modern gym interior",
    tint: "from-rose-900/80 via-red-900/60 to-transparent",
  },
  { kind: "promote" },
];

const AUTO_ROTATE_MS = 6000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const total = SLIDES.length;

  const goTo = useCallback((i: number) => {
    setIndex(((i % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  // Auto-rotate
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => next(), AUTO_ROTATE_MS);
    return () => clearTimeout(t);
  }, [index, paused, next]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured content"
    >
      {/* Slide track */}
      <div className="relative h-[320px] sm:h-[360px] lg:h-[380px]">
        {SLIDES.map((slide, i) => {
          const isActive = i === index;
          return (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              {slide.kind === "hero" && <HeroSlide />}
              {slide.kind === "ad" && <AdSlide slide={slide} />}
              {slide.kind === "promote" && <PromoteSlide />}
            </div>
          );
        })}

        {/* Prev/Next arrows */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/70 backdrop-blur-md border border-border/60 text-foreground hover:bg-white hover:shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          style={{ opacity: 0.85 }}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/70 backdrop-blur-md border border-border/60 text-foreground hover:bg-white hover:shadow-md transition-all"
          style={{ opacity: 0.85 }}
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Dots + progress */}
      <div className="relative z-20 pb-4 sm:pb-5 pt-3 flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => {
          const isActive = i === index;
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="group/dot relative h-1.5 rounded-full overflow-hidden transition-all"
              style={{ width: isActive ? 32 : 10 }}
            >
              <span className={`absolute inset-0 ${isActive ? "bg-primary/20" : "bg-muted-foreground/25"} transition-colors`} />
              {isActive && !paused && (
                <span
                  key={`fill-${index}`}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                  style={{ animation: `carousel-fill ${AUTO_ROTATE_MS}ms linear forwards` }}
                />
              )}
              {isActive && paused && (
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent" />
              )}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes carousel-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}

// ─── Slide: existing hero ───────────────────────────────────────────────────

function HeroSlide() {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl animate-float" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent/8 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-14 text-center h-full flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md border border-primary/15 px-3.5 py-1.5 text-[11px] font-semibold text-primary mb-4 shadow-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 live-indicator" />
          <Sparkles className="h-3 w-3" />
          Discover · Book · Play
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
          Book anything.{" "}
          <span className="text-gradient animate-gradient">Instantly.</span>
        </h1>

        <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Turfs, gaming lounges, salons, studios — real-time slots, zero friction.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {TRUST_PILLS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-sm"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Slide: sponsored ad ─────────────────────────────────────────────────────

function AdSlide({ slide }: { slide: Extract<Slide, { kind: "ad" }> }) {
  const BadgeIcon = slide.badgeIcon;
  return (
    <div className="relative h-full overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.image}
        alt={slide.imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {/* Gradient tint */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.tint}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-xl text-white">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 mb-4">
            <BadgeIcon className="h-3 w-3" />
            {slide.badge}
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight drop-shadow-lg">
            {slide.title}
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/90 max-w-md drop-shadow-md">
            {slide.subtitle}
          </p>
          <Link
            href={slide.ctaHref}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white text-foreground px-5 py-2.5 text-sm font-semibold shadow-lg hover:bg-white/95 hover:shadow-xl transition-all"
          >
            {slide.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Corner "Ad" label */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/15 text-[9px] uppercase tracking-wider font-bold text-white/80">
        Ad
      </div>
    </div>
  );
}

// ─── Slide: promote your ads here ────────────────────────────────────────────

function PromoteSlide() {
  return (
    <div className="relative h-full overflow-hidden bg-gradient-to-br from-primary via-accent to-primary">
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,.35) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 h-full flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white mb-4">
          <Megaphone className="h-3.5 w-3.5" />
          Your ad here
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05] drop-shadow-lg">
          Put your business in front of{" "}
          <span className="underline decoration-white/40 decoration-4 underline-offset-4">thousands</span>.
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-white/90 max-w-xl drop-shadow-sm">
          Feature your venue in this carousel. Pick a day, a week, or a month — we handle the rest.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/list-your-business/ads"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-primary px-6 py-3 text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            See ad plans
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/list-your-business/ads#request"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 text-white px-5 py-3 text-sm font-semibold hover:bg-white/25 transition-all"
          >
            Request a slot
          </Link>
        </div>
      </div>
    </div>
  );
}
