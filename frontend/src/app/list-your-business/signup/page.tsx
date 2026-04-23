"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import type { SubscriptionPlan } from "@/lib/types";

type SignupPlan = Exclude<SubscriptionPlan, "full_service">;

const PLAN_COPY: Record<SignupPlan, { label: string; blurb: string }> = {
  free: {
    label: "Free plan",
    blurb: "Basic booking page. No credit card required.",
  },
  standard: {
    label: "Standard plan — ₹1,500/month",
    blurb: "Customizable pages, theme, editable navigation.",
  },
  ai: {
    label: "AI plan — ₹2,500/month",
    blurb: "AI-generated website with drag-and-edit sections.",
  },
};

const CATEGORY_OPTIONS = [
  "turf",
  "gaming-lounge",
  "salon",
  "fitness",
  "studio",
  "restaurant",
  "photography",
  "art",
  "other",
];

function BusinessSignup() {
  const router = useRouter();
  const params = useSearchParams();
  const { registerBusiness } = useAuth();

  const rawPlan = params.get("plan") as SubscriptionPlan | null;
  const planFromQuery: SignupPlan =
    rawPlan === "free" || rawPlan === "standard" || rawPlan === "ai"
      ? rawPlan
      : "free";

  const [plan, setPlan] = useState<SignupPlan>(planFromQuery);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPlan(planFromQuery);
  }, [planFromQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerBusiness({
        name,
        email,
        password,
        phone,
        businessName,
        category,
        description: description || undefined,
        plan,
      });
      router.push("/setup");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copy = PLAN_COPY[plan];

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-5/12 relative bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden />
        <div className="relative flex flex-col justify-center w-full px-12 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg mb-8">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight leading-tight">
              List your business <br />
              <span className="text-gradient">in under 2 minutes.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {copy.blurb}
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "No setup fees",
                "Go live same day",
                "Cancel any time",
                "Real-time booking engine built in",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12 rounded-2xl border border-border/60 bg-background/60 backdrop-blur-sm p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Selected plan
              </p>
              <p className="mt-1 font-semibold">{copy.label}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Change plan?{" "}
                <Link href="/list-your-business#plans" className="text-primary underline">
                  Compare all plans
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-1 items-start sm:items-center justify-center px-4 sm:px-8 py-10 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">Bokingo</span>
          </div>

          <div className="lg:hidden mb-6 rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Selected plan
            </p>
            <p className="mt-1 font-semibold">{copy.label}</p>
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tell us about your business
            </h1>
            <p className="text-muted-foreground">
              You can fine-tune everything once you&apos;re in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Your name">
                <Input required value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" placeholder="Full name" />
              </Field>
              <Field label="Phone">
                <Input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" placeholder="9876543210" />
              </Field>
            </div>

            <Field label="Email">
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" placeholder="you@business.com" />
            </Field>

            <Field label="Password">
              <div className="relative">
                <Input
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pr-10"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="pt-2 border-t border-border/60" />

            <Field label="Business name">
              <Input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-11 rounded-xl" placeholder="e.g., GameZone Kodungallur" />
            </Field>

            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c.replace("-", " ")}</option>
                ))}
              </select>
            </Field>

            <Field label="Short description (optional)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                placeholder="What do you offer? (1–2 sentences)"
              />
            </Field>

            <input type="hidden" name="plan" value={plan} />

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary border-0 text-white shadow-md hover:shadow-lg transition-all text-sm font-medium"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Business Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By creating an account you agree to our Terms & Privacy Policy.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

export default function BusinessSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <BusinessSignup />
    </Suspense>
  );
}
