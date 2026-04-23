"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "super_admin") {
        router.push("/admin");
      } else if (user.role === "client_admin") {
        const ob = user.onboarding;
        if (ob?.subscription?.status === "pending") {
          router.push("/list-your-business/pending");
        } else if (ob?.subscription?.status === "rejected") {
          router.push("/list-your-business/plans");
        } else if (!ob?.setupCompleted) {
          router.push("/dashboard/setup");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative gradient-hero flex-col justify-between p-12 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute inset-0 dot-pattern opacity-30" />

        <Link href="/" className="relative inline-flex items-center w-fit">
          <Image
            src="/images/brand/Bokingo_large.png"
            alt="Bokingo"
            width={140}
            height={36}
          />
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Welcome back</p>
          <h2 className="text-4xl font-bold tracking-tight leading-tight">
            Sign in to<br />keep booking.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Manage bookings, grow revenue, delight customers — all from one place.
          </p>
        </div>

        <p className="relative text-xs text-muted-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-indicator" />
          1,247 people booked today
        </p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <Image
              src="/images/brand/Bokingo_small.png"
              alt="Bokingo"
              width={36}
              height={36}
            />
            <span className="font-semibold text-lg">Bokingo</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to continue to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm text-center bg-destructive/10 text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="you@example.com" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
