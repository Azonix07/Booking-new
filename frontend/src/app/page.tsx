"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/home/hero";
import { PopularCategories } from "@/components/home/categories";
import { Zap } from "lucide-react";

const FeaturedBusinesses = dynamic(
  () => import("@/components/home/featured").then((m) => m.FeaturedBusinesses),
  { ssr: false, loading: () => <SectionPlaceholder /> },
);

const NearbySection = dynamic(
  () => import("@/components/home/nearby").then((m) => m.NearbySection),
  { ssr: false, loading: () => <SectionPlaceholder /> },
);

const HowItWorks = dynamic(
  () => import("@/components/home/how-it-works").then((m) => m.HowItWorks),
  { ssr: false, loading: () => <SectionPlaceholder /> },
);

const ListYourBusinessCta = dynamic(
  () =>
    import("@/components/home/list-your-business-cta").then(
      (m) => m.ListYourBusinessCta,
    ),
  { ssr: false, loading: () => <SectionPlaceholder /> },
);

function SectionPlaceholder() {
  return <div className="h-[600px]" aria-hidden />;
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        <Hero />
        <PopularCategories />
        <FeaturedBusinesses />
        <NearbySection />
        <HowItWorks />
        <ListYourBusinessCta />
        <Footer />
      </main>
    </>
  );
}

function Footer() {
  return (
    <footer className="relative border-t bg-gradient-to-b from-gray-50/50 to-white py-16 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-white shadow-sm shadow-primary/25">
                <Zap className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="font-bold tracking-tight">BookAnything</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Book anything, anywhere — instantly. The smartest way to discover
              and reserve experiences near you.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Customers</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/marketplace" className="hover:text-primary transition-colors">Explore</Link></li>
              <li><Link href="/marketplace?view=categories" className="hover:text-primary transition-colors">Categories</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Sign up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Business</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/list-your-business" className="hover:text-primary transition-colors">List your business</Link></li>
              <li><Link href="/list-your-business#plans" className="hover:text-primary transition-colors">Plans</Link></li>
              <li><Link href="/list-your-business/full-service" className="hover:text-primary transition-colors">Full-service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-primary transition-colors">Log in</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Sign up</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} BookAnything. Built with care.</span>
          <span className="flex items-center gap-1">
            Made with <span className="text-red-400">&#9829;</span> in India
          </span>
        </div>
      </div>
    </footer>
  );
}
