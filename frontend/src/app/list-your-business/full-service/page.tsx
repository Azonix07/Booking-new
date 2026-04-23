"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

const FEATURE_OPTIONS = [
  "Online booking & payments",
  "Custom domain",
  "SEO optimization",
  "Blog / content pages",
  "Gallery / portfolio",
  "Multi-location support",
  "Customer reviews",
  "Loyalty / membership",
  "Newsletter signup",
  "Live chat",
  "Analytics dashboard",
  "Third-party integrations",
];

const BUDGET_OPTIONS = [
  { label: "Under ₹50,000", value: 50000 },
  { label: "₹50,000 – ₹1,00,000", value: 100000 },
  { label: "₹1,00,000 – ₹3,00,000", value: 300000 },
  { label: "₹3,00,000 – ₹5,00,000", value: 500000 },
  { label: "₹5,00,000+", value: 750000 },
];

const TIMELINE_OPTIONS = [
  "ASAP (within 2 weeks)",
  "1 month",
  "1–2 months",
  "2–3 months",
  "Flexible",
];

interface CreateResponse {
  id: string;
  status: string;
}

export default function FullServiceRequestPage() {
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [designPreferences, setDesignPreferences] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [existingWebsite, setExistingWebsite] = useState("");
  const [budget, setBudget] = useState<number | "">("");
  const [timeline, setTimeline] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleFeature = (value: string) => {
    setFeatures((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        businessName,
        businessType,
        businessDescription,
        features: features.length > 0 ? features : undefined,
        designPreferences: designPreferences || undefined,
        targetAudience: targetAudience || undefined,
        existingWebsite: existingWebsite || undefined,
        budget: typeof budget === "number" ? budget : undefined,
        timeline: timeline || undefined,
        additionalNotes: additionalNotes || undefined,
        contact: {
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
        },
      };
      const res = await api.post<CreateResponse>(
        "/full-service-requests",
        payload,
      );
      setReferenceId(res.id);
      setSubmitted(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Could not submit request. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-16 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Request received!
          </h1>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Thanks for reaching out. Our team will review your requirements and
            contact you within <strong className="text-foreground">1–2 business days</strong> to
            discuss scope, timeline, and pricing.
          </p>

          {referenceId && (
            <div className="mt-8 rounded-xl border border-border/60 bg-muted/30 p-4 text-left inline-block">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Reference ID
              </p>
              <p className="mt-1 font-mono text-sm">{referenceId}</p>
            </div>
          )}

          <div className="mt-10 space-y-3 text-sm text-left max-w-md mx-auto">
            <p className="font-medium">What happens next:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  A project manager reviews your requirements.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  We'll reach out by email or phone to schedule a discovery call.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  After scope alignment, you'll receive a proposal with timeline
                  and pricing.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/">
              <Button variant="outline" className="rounded-xl">
                Back to home
              </Button>
            </Link>
            <Link href="/list-your-business#plans">
              <Button className="rounded-xl bg-primary border-0 text-white">
                See self-serve plans
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-5/12 relative bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden />
        <motion.div
          aria-hidden
          className="absolute -top-24 -right-24 w-96 h-96 bg-primary/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex flex-col justify-center w-full px-12 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg mb-8">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight leading-tight">
              A fully custom site,{" "}
              <span className="text-gradient">built by our team.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Tell us about your business and what you want. We'll build a
              fast, SEO-optimized, mobile-first website on your own domain —
              hosted independently of the platform.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Fully custom design and build",
                "Your own domain, hosted independently",
                "SEO-optimized and mobile-first",
                "Dedicated developer + project manager",
                "Optional free listing on the platform",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12 rounded-2xl border border-border/60 bg-background/60 backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4 text-primary" />
                Request-based, not instant
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                This isn't a self-serve plan. After you submit, our team will
                review your requirements and contact you with a tailored
                proposal.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 sm:px-8 py-10 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">Bokingo</span>
          </div>

          <div className="space-y-2 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Full-Service Request
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tell us about your project
            </h1>
            <p className="text-muted-foreground">
              The more detail you share, the faster we can come back with an
              accurate proposal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            <Section title="About your business">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Business name" required>
                    <Input
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="e.g., GameZone Kodungallur"
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Business type" required>
                    <Input
                      required
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="e.g., Turf, Salon, Studio"
                      maxLength={100}
                    />
                  </Field>
                </div>

                <Field
                  label="Tell us about your business"
                  required
                  hint="At least 20 characters — what you do, who you serve, what makes you different."
                >
                  <textarea
                    required
                    minLength={20}
                    maxLength={2000}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    placeholder="A few sentences about your business..."
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {businessDescription.length}/2000
                  </div>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Target audience">
                    <Input
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="e.g., Local families, working professionals"
                      maxLength={500}
                    />
                  </Field>
                  <Field label="Existing website (if any)">
                    <Input
                      type="url"
                      value={existingWebsite}
                      onChange={(e) => setExistingWebsite(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="https://..."
                      maxLength={200}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            <Section title="What do you need?">
              <div className="space-y-5">
                <Field label="Features you want">
                  <div className="flex flex-wrap gap-2">
                    {FEATURE_OPTIONS.map((f) => {
                      const active = features.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => toggleFeature(f)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            active
                              ? "bg-primary text-white border-transparent shadow-sm"
                              : "border-border/70 bg-background hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field
                  label="Design preferences"
                  hint="Colors, mood, reference sites you like."
                >
                  <textarea
                    value={designPreferences}
                    onChange={(e) => setDesignPreferences(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    placeholder="Clean and modern, similar to ..."
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Budget">
                    <select
                      value={budget === "" ? "" : String(budget)}
                      onChange={(e) =>
                        setBudget(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    >
                      <option value="">Not sure yet</option>
                      {BUDGET_OPTIONS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Timeline">
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    >
                      <option value="">Select a timeline</option>
                      {TIMELINE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Anything else we should know?">
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    placeholder="Integrations, existing brand assets, constraints..."
                  />
                </Field>
              </div>
            </Section>

            <Section title="How can we reach you?">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Your name" required>
                    <Input
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="Full name"
                      maxLength={100}
                    />
                  </Field>
                  <Field label="Phone" required>
                    <Input
                      required
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="9876543210"
                      maxLength={20}
                    />
                  </Field>
                </div>
                <Field label="Email" required>
                  <Input
                    required
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-11 rounded-xl"
                    placeholder="you@business.com"
                  />
                </Field>
              </div>
            </Section>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary border-0 text-white shadow-md hover:shadow-lg transition-all text-sm font-medium"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Submit request
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Submitting this request does not create an account or charge
                you. Our team will contact you to discuss next steps.
              </p>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Prefer a self-serve plan?{" "}
            <Link
              href="/list-your-business#plans"
              className="text-primary font-medium hover:underline"
            >
              Compare plans
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
