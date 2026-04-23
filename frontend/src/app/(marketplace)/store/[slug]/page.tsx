"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import { DynamicWebsite } from "@/components/dynamic-website";
import { PageLoader } from "@/components/page-loader";
import { ErrorState } from "@/components/error-state";
import type { StorefrontData, WebsiteConfig } from "@/lib/types";

export default function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [storeData, setStoreData] = useState<StorefrontData | null>(null);
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<StorefrontData>(`/marketplace/storefront?slug=${slug}`);
        setStoreData(data);

        if (data.tenant?._id) {
          api.setTenantId(data.tenant._id);
          try {
            const cfg = await api.get<WebsiteConfig>("/website/public");
            if (cfg) {
              setWebsiteConfig(cfg);
            }
          } catch {
            // No website config — that's fine
          }
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <PageLoader />;
  if (error || !storeData) return <ErrorState message="Store not found" />;

  // If they have a published website config, render the dynamic website
  if (websiteConfig) {
    return (
      <DynamicWebsite
        config={websiteConfig}
        tenant={storeData.tenant}
        services={storeData.services}
      />
    );
  }

  // If there's a redirect needed
  if (storeData.shouldRedirect && storeData.redirectUrl) {
    if (typeof window !== "undefined") {
      window.location.href = storeData.redirectUrl;
    }
    return <PageLoader />;
  }

  // Fallback: redirect to marketplace business page
  if (typeof window !== "undefined") {
    window.location.href = `/marketplace/${slug}`;
  }
  return <PageLoader />;
}
