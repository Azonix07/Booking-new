"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import type { MarketplaceBusiness } from "@/lib/types";
import { BusinessCard } from "./business-card";
import { BusinessCardSkeleton } from "./skeleton";

export function FeaturedBusinesses() {
  const [featured, setFeatured] = useState<MarketplaceBusiness[] | null>(null);

  useEffect(() => {
    api
      .get<MarketplaceBusiness[]>("/marketplace/featured")
      .then((d) => setFeatured(d ?? []))
      .catch(() => setFeatured([]));
  }, []);

  if (featured !== null && featured.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Featured Businesses
            </h2>
            <p className="mt-2 text-muted-foreground text-lg">
              Hand-picked favorites our community loves
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="ghost" className="hidden sm:flex gap-2 rounded-xl group">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured === null
            ? Array.from({ length: 6 }).map((_, i) => <BusinessCardSkeleton key={i} />)
            : featured.slice(0, 6).map((biz, i) => (
                <motion.div
                  key={biz._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: (i % 3) * 0.08 }}
                >
                  <BusinessCard business={biz} />
                </motion.div>
              ))}
        </div>

        <div className="sm:hidden mt-8 text-center">
          <Link href="/marketplace">
            <Button variant="outline" className="rounded-xl gap-2">
              View All Businesses
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
