"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/page-loader";
import { ErrorState } from "@/components/error-state";
import { DynamicWebsite } from "@/components/dynamic-website";
import { MapPin, Star, Clock, Phone, Mail, Globe, ArrowRight } from "lucide-react";
import type { MarketplaceBusiness, Service, WebsiteConfig } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [business, setBusiness] = useState<MarketplaceBusiness | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const biz = await api.get<MarketplaceBusiness>(`/marketplace/business/${slug}`);
        setBusiness(biz);
        if (biz._id) {
          api.setTenantId(biz._id);
          const svc = await api.get<Service[]>("/services");
          setServices(Array.isArray(svc) ? svc : []);

          // Try to load the business owner's custom website config
          try {
            const cfg = await api.get<WebsiteConfig>("/website/public");
            if (cfg) setWebsiteConfig(cfg);
          } catch {
            // No website config — fall back to hardcoded layout
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
  if (error || !business) return <ErrorState message="Business not found" />;

  // If the business owner has a published website, show their custom website
  if (websiteConfig) {
    return (
      <DynamicWebsite
        config={websiteConfig}
        tenant={business}
        services={services}
      />
    );
  }

  // Fallback: standard marketplace layout for businesses without a custom website
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-3xl font-bold shrink-0">
          {business.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{business.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {business.category && <Badge variant="secondary">{business.category}</Badge>}
            {business.rating?.average != null && (
              <div className="flex items-center text-sm text-yellow-600">
                <Star className="h-4 w-4 fill-current mr-1" />
                {business.rating?.average?.toFixed(1)} ({business.reviewCount || 0} reviews)
              </div>
            )}
          </div>
          {business.description && (
            <p className="text-muted-foreground mt-3">{business.description}</p>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      <div className="grid md:grid-cols-3 gap-8">
        {/* Services */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Services</h2>
          {services.length === 0 ? (
            <p className="text-muted-foreground">No services listed yet.</p>
          ) : (
            <div className="space-y-3">
              {services.map((svc) => (
                <Card key={svc._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium">{svc.name}</h3>
                      {svc.description && (
                        <p className="text-sm text-muted-foreground mt-1">{svc.description}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-sm">
                        <span className="text-primary font-medium">{formatCurrency(svc.price)}</span>
                        {svc.durationOptions && svc.durationOptions.length > 0 && (
                          <span className="text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {svc.durationOptions.map((d) => `${d.minutes}min`).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/book/${slug}?service=${svc._id}`}>
                      <Button size="sm">
                        Book <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact & Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {business.address?.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    {[business.address?.street, business.address?.city, business.address?.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{business.email}</span>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="underline">{business.website}</a>
                </div>
              )}
            </CardContent>
          </Card>

          {business.businessHours && business.businessHours.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Business Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {business.businessHours.map((h) => {
                  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                  return (
                  <div key={h.day} className="flex justify-between text-muted-foreground">
                    <span>{dayNames[h.day] || h.day}</span>
                    <span>{h.isClosed ? "Closed" : `${h.open} - ${h.close}`}</span>
                  </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
