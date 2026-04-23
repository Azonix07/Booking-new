"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Eye, EyeOff, Zap, Building2 } from "lucide-react";

export default function RegisterPage() {
  const { registerCustomer } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerCustomer({ name, email, password, phone });
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative gradient-hero flex-col justify-between p-12 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute inset-0 dot-pattern opacity-30" />

        <Link href="/" className="relative inline-flex items-center gap-2.5 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-white shadow-md shadow-primary/25">
            <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg">BookAnything</span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Get started</p>
          <h2 className="text-4xl font-bold tracking-tight leading-tight">
            Book anything.<br />In a tap.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Turfs, gaming lounges, salons, studios — real-time availability, instant confirmation.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3 text-xs text-muted-foreground">
          {["Real-time slots", "Secure payments", "24/7 support"].map((t) => (
            <div key={t} className="px-3 py-2.5 rounded-xl border bg-white/60 backdrop-blur-sm shadow-sm">{t}</div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-white shadow-sm shadow-primary/25">
              <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-lg">BookAnything</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-1 text-sm">Book your first experience in seconds.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm text-center bg-destructive/10 text-destructive">{error}</div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-11" placeholder="John Doe" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" placeholder="9876543210" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>

          <div className="mt-8 pt-6 border-t">
            <Link href="/list-your-business" className="group flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <Building2 className="h-4 w-4" />
              Own a business? List it here
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
