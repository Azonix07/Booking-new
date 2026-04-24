"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  Megaphone,
  MousePointerClick,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Users,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";

interface AdPlan {
  key: "day" | "week" | "month";
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  impressions: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
  savings?: string;
}

const PLANS: AdPlan[] = [
  {
    key: "day",
    name: "Day Boost",
    price: "₹499",
    cadence: "per day",
    tagline: "Test the waters with a one-day spotlight.",
    impressions: "~5,000 views",
    features: [
      "Featured in home carousel for 24 hours",
      "One ad slide with custom image & copy",
      "Click-through to your booking page",
      "Basic performance report at end of run",
      "Launch same-day after approval",
    ],
    ctaLabel: "Book a day",
  },
  {
    key: "week",
    name: "Week Blitz",
    price: "₹2,499",
    cadence: "per 7 days",
    tagline: "A full week of prime placement — most popular.",
    impressions: "~35,000 views",
    features: [
      "Featured in home carousel for 7 days",
      "Priority placement (earlier slot)",
      "A/B test up to 2 ad variants",
      "Mid-week performance check-in",
      "Detailed analytics dashboard",
      "Priority support",
    ],
    ctaLabel: "Book a week",
    highlighted: true,
    savings: "Save ₹990",
  },
  {
    key: "month",
    name: "Month Takeover",
    price: "₹7,999",
    cadence: "per 30 days",
    tagline: "Maximum reach. Best price per day.",
    impressions: "~150,000+ views",
    features: [
      "Featured for 30 consecutive days",
      "Guaranteed top-3 slot placement",
      "Up to 3 rotating ad variants",
      "Weekly performance reviews",
      "Dedicated ads strategist",
      "Free creative refresh mid-campaign",
      "Bonus: social cross-promotion",
    ],
    ctaLabel: "Book a month",
    savings: "Save ₹6,971",
  },
];

const STATS = [
  { icon: Eye, value: "50K+", label: "Daily impressions" },
  { icon: MousePointerClick, value: "3.2%", label: "Average CTR" },
  { icon: Users, value: "10K+", label: "Active users/week" },
  { icon: TrendingUp, value: "4.7×", label: "Avg. booking lift" },
];

const HOW_IT_WORKS = [
  {
    icon: Megaphone,
    title: "Pick a plan",
    desc: "Day, week, or month — start small or go big.",
  },
  {
    icon: Sparkles,
    title: "Send us your ad",
    desc: "Image, headline, and a link. We polish it if needed — free.",
  },
  {
    icon: Target,
    title: "We place & optimize",
    desc: "Your ad goes live in the home carousel. We watch the numbers.",
  },
  {
    icon: TrendingUp,
    title: "Track results",
    desc: "Real-time analytics. Adjust or extend any time.",
  },
];

const FAQS = [
  {
    q: "Where exactly will my ad appear?",
    a: "Your ad rotates inside the hero carousel on our home page — the first thing every visitor sees. Each slide auto-plays for 6 seconds.",
  },
  {
    q: "How soon can it go live?",
    a: "Most ads go live within a few hours of approval. Same-day launch is typical if submitted before 4pm.",
  },
  {
    q: "Do I need to design the ad myself?",
    a: "No. Send us an image and a sentence — our team will polish the copy, crop the image, and send you a proof before it goes live. Free with every plan.",
  },
  {
    q: "What if my ad doesn't perform?",
    a: "We'll review mid-campaign and swap creative or adjust targeting at no extra cost. If something's clearly off, we'll extend the run.",
  },
  {
    q: "Can I cancel or pause?",
    a: "Day plans run to completion. Week and month plans can be paused or refunded pro-rata within the first 24 hours.",
  },
];

export default function AdsPlansPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary via-accent to-primary overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(255,255,255,.35) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <motion.div
            aria-hidden
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl"
            animate={{ y: [0, 24, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl"
            animate={{ y: [0, -24, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-20 sm:pt-28 sm:pb-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full bg-white/15 border-white/30 text-white backdrop-blur-md"
              >
                <Megaphone className="h-3.5 w-3.5 mr-1.5" />
                Advertise on Bokingo
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white drop-shadow-sm">
                Put your business on the{" "}
                <span className="underline decoration-white/40 decoration-4 underline-offset-4">
                  front page
                </span>
                .
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                Feature your venue in our home carousel — the hero spot every
                visitor sees first. Pick a day, a week, or a month.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#plans">
                  <Button
                    size="lg"
                    className="rounded-xl bg-white text-primary hover:bg-white/95 border-0 shadow-xl hover:shadow-2xl transition-all px-8 h-12 font-bold"
                  >
                    See plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="#request">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
                  >
                    Request a slot
                  </Button>
                </a>
              </div>

              {/* Stats strip */}
              <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {STATS.map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-4"
                  >
                    <Icon className="h-5 w-5 text-white/80 mx-auto mb-1.5" />
                    <p className="text-2xl sm:text-3xl font-extrabold text-white">
                      {value}
                    </p>
                    <p className="text-[11px] sm:text-xs text-white/80 font-medium">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 sm:py-24 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                How it works
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Four steps. No ad-buying jargon.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {HOW_IT_WORKS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
                  >
                    <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-md">
                      {i + 1}
                    </div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section
          id="plans"
          className="py-20 sm:py-24 px-4 sm:px-6 bg-muted/30 scroll-mt-16"
        >
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Pick your run length
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                No hidden fees. No minimum commitment.
              </p>
            </motion.div>

            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
              style={{ perspective: "1200px" }}
            >
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                  style={{ transformStyle: "preserve-3d" }}
                  className={`relative rounded-2xl border bg-card p-6 flex flex-col shadow-sm hover:shadow-xl transition-shadow will-change-transform ${
                    plan.highlighted
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border/60"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary text-white shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      Most popular
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground min-h-[2.5rem]">
                      {plan.tagline}
                    </p>
                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {plan.cadence}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {plan.impressions}
                      </span>
                      {plan.savings && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300">
                          {plan.savings}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.div className="mt-6" whileTap={{ scale: 0.97 }}>
                    <a href={`#request?plan=${plan.key}`}>
                      <Button
                        className={`w-full rounded-xl h-11 ${
                          plan.highlighted
                            ? "bg-primary border-0 text-white shadow-sm hover:shadow-md"
                            : ""
                        }`}
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {plan.ctaLabel}
                      </Button>
                    </a>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Prices in INR, exclusive of GST. Volume discounts available for
              agencies — contact us.
            </p>
          </div>
        </section>

        {/* Request form */}
        <section
          id="request"
          className="py-20 sm:py-24 px-4 sm:px-6 scroll-mt-16"
        >
          <div className="mx-auto max-w-3xl">
            <RequestForm />
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 bg-muted/30">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight">
                Questions, answered
              </h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <motion.details
                  key={faq.q}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="group rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-sm sm:text-base">
                    {faq.q}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-4 sm:px-6 text-center">
          <div className="mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Trusted by 120+ local businesses
            </div>
            <h3 className="text-2xl font-bold">Not sure which plan fits?</h3>
            <p className="mt-2 text-muted-foreground">
              Tell us about your business and we&apos;ll recommend the best run
              length — no obligation.
            </p>
            <Link href="/list-your-business">
              <Button variant="outline" className="mt-5 rounded-xl gap-2">
                <Zap className="h-4 w-4" />
                Back to listing plans
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

// ─── Request form ────────────────────────────────────────────────────────────

function RequestForm() {
  const [plan, setPlan] = useState<"day" | "week" | "month">("week");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    website: "",
    message: "",
    startDate: "",
  });

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulated submission — backend wiring happens when API is ready
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 sm:p-10 text-center dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800"
      >
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white mb-4 shadow-lg shadow-green-500/30">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-2xl font-bold">Got it — thanks!</h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          We&apos;ll review your request and reach out within 1 business day with
          next steps, a preview, and a payment link.
        </p>
        <Button
          variant="outline"
          className="mt-6 rounded-xl"
          onClick={() => {
            setSubmitted(false);
            setForm({
              businessName: "",
              email: "",
              phone: "",
              website: "",
              message: "",
              startDate: "",
            });
          }}
        >
          Submit another
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <Badge
          variant="secondary"
          className="mb-3 px-3 py-1 rounded-full bg-primary/10 border-primary/20 text-primary"
        >
          <Megaphone className="h-3 w-3 mr-1.5" />
          Request an ad slot
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Tell us about your ad
        </h2>
        <p className="mt-3 text-muted-foreground text-lg">
          Takes under 2 minutes. We&apos;ll reply within a business day.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm space-y-5"
      >
        {/* Plan picker */}
        <div>
          <Label className="text-sm font-semibold">Which plan?</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPlan(p.key)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  plan === p.key
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {p.name.split(" ")[0]}
                </p>
                <p className="mt-1 text-base font-bold">{p.price}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.cadence}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName" className="text-sm">
              Business name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessName"
              required
              placeholder="Acme Gaming Lounge"
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@business.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm">
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="website" className="text-sm">
              Website / booking link
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://..."
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="startDate" className="text-sm flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Preferred start date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="message" className="text-sm">
            Tell us what you want to promote
          </Label>
          <textarea
            id="message"
            rows={4}
            placeholder="e.g. Weekend PS5 packages — 10% off for groups of 4+. Want the ad to run Friday evenings."
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            No need for polished copy — send us an idea and we&apos;ll craft it
            with you.
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full rounded-xl h-12 shadow-md shadow-primary/20 hover:shadow-primary/30"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              Send request
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          No payment now. We&apos;ll send a preview & invoice after reviewing.
        </p>
      </form>
    </motion.div>
  );
}
