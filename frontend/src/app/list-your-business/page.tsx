"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Globe,
  PaintBucket,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { PlansGrid } from "@/components/list-your-business/plans-grid";

const BENEFITS = [
  {
    icon: Calendar,
    title: "Real-time booking engine",
    description:
      "Live availability, no double bookings, automatic confirmations.",
  },
  {
    icon: Users,
    title: "Reach more customers",
    description: "Show up in nearby search the moment someone opens the app.",
  },
  {
    icon: BarChart3,
    title: "Insights that matter",
    description:
      "See revenue, occupancy, repeat customers — at a glance, every day.",
  },
  {
    icon: PaintBucket,
    title: "Your brand, your page",
    description:
      "Starter templates, customizable pages, or a fully custom site built for you.",
  },
  {
    icon: Shield,
    title: "Secure payments",
    description: "PCI-compliant Razorpay integration, upfront or on-arrival.",
  },
  {
    icon: Zap,
    title: "Launch in minutes",
    description: "No setup fees. Go from signup to first booking same-day.",
  },
];

export default function ListYourBusinessPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        {/* Intro */}
        <section className="relative bg-gray-50 overflow-hidden">
          <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden />
          <motion.div
            aria-hidden
            className="absolute top-16 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
            animate={{ y: [0, 24, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full border-primary/20 bg-primary/5"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                For businesses, by people who run businesses
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Grow your bookings.{" "}
                <span className="text-gradient">On your terms.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Whether you want a free booking page or a fully custom
                SEO-optimized website — there&apos;s a plan built for where you
                are today.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  ~10
                </span>
                <span>Minute setup · Guided in 9 short steps · Save and return anytime</span>
              </div>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#plans">
                  <Button
                    size="lg"
                    className="rounded-xl bg-primary border-0 text-white shadow-lg hover:shadow-xl transition-all px-8 h-12"
                  >
                    Choose a Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Link href="/list-your-business/full-service">
                  <Button variant="outline" size="lg" className="rounded-xl px-8 h-12">
                    Need something custom?
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
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
                Everything you need to run a modern venue
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                One platform, four plans, no lock-in.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold">{b.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {b.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="py-20 sm:py-24 px-4 sm:px-6 bg-muted/30 scroll-mt-16">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Choose your plan
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Start free. Upgrade whenever you&apos;re ready.
              </p>
            </motion.div>

            <PlansGrid />
          </div>
        </section>

        {/* FAQ teaser / trust */}
        <section className="py-16 px-4 sm:px-6 text-center">
          <div className="mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              No setup fees · Cancel any time
            </div>
            <h3 className="text-2xl font-bold">Questions? We&apos;re here.</h3>
            <p className="mt-2 text-muted-foreground">
              If nothing fits, our team can build something custom for you.
            </p>
            <Link href="/list-your-business/full-service">
              <Button variant="outline" className="mt-5 rounded-xl gap-2">
                <Globe className="h-4 w-4" />
                Request a custom build
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
