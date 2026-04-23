"use client";

import type { WebsiteConfig, WebsiteSection, Tenant, Service } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Phone, Mail, ArrowRight, ChevronRight, ChevronDown, Users } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

interface DynamicWebsiteProps {
  config: WebsiteConfig;
  tenant: Tenant;
  services: Service[];
}

export function DynamicWebsite({ config, tenant, services }: DynamicWebsiteProps) {
  const visibleSections = config.sections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const style = {
    "--dw-primary": config.theme.primaryColor,
    "--dw-secondary": config.theme.secondaryColor,
    "--dw-bg": config.theme.backgroundColor,
    "--dw-text": config.theme.textColor,
    "--dw-radius": config.theme.borderRadius,
    fontFamily: config.theme.fontFamily,
    color: config.theme.textColor,
    backgroundColor: config.theme.backgroundColor,
  } as React.CSSProperties;

  const headerClass =
    config.layout.headerStyle === "transparent"
      ? "absolute top-0 left-0 right-0 z-50 bg-transparent"
      : config.layout.headerStyle === "centered"
        ? "sticky top-0 z-50 border-b backdrop-blur"
        : "sticky top-0 z-50 border-b backdrop-blur";

  return (
    <div style={style} className="min-h-screen" data-theme={config.theme.mode}>
      {/* Header */}
      <header
        className={headerClass}
        style={{
          backgroundColor:
            config.layout.headerStyle === "transparent"
              ? "transparent"
              : `color-mix(in srgb, ${config.theme.backgroundColor} 90%, transparent)`,
          borderColor: `color-mix(in srgb, ${config.theme.textColor} 10%, transparent)`,
        }}
      >
        <div
          className={`mx-auto flex h-16 items-center px-6 ${
            config.layout.headerStyle === "centered" ? "justify-center gap-6" : "justify-between"
          }`}
          style={{ maxWidth: config.layout.maxWidth }}
        >
          <div className="flex items-center gap-3">
            {tenant.branding?.logo && (
              <img src={tenant.branding.logo} alt={tenant.name} className="h-9 w-9 rounded-lg object-cover" />
            )}
            <span className="text-lg font-bold">{tenant.name}</span>
          </div>
          <Link href={`/book/${tenant.slug}`}>
            <Button
              size="sm"
              style={{
                backgroundColor: config.theme.primaryColor,
                color: "#fff",
                borderRadius: config.theme.borderRadius,
              }}
            >
              Book Now
            </Button>
          </Link>
        </div>
      </header>

      {/* Sections */}
      {visibleSections.map((section, i) => (
        <SectionRenderer
          key={`${section.type}-${i}`}
          section={section}
          tenant={tenant}
          services={services}
          config={config}
        />
      ))}

      {/* Footer */}
      {config.layout.footerStyle !== "none" && (
        <footer
          className="border-t py-10 text-center text-sm"
          style={{
            borderColor: `color-mix(in srgb, ${config.theme.textColor} 10%, transparent)`,
            color: `color-mix(in srgb, ${config.theme.textColor} 60%, transparent)`,
          }}
        >
          {config.layout.footerStyle === "full" ? (
            <div className="mx-auto px-6" style={{ maxWidth: config.layout.maxWidth }}>
              <div className="grid md:grid-cols-3 gap-8 text-left mb-8">
                <div>
                  <p className="font-bold text-base mb-2" style={{ color: config.theme.textColor }}>
                    {tenant.name}
                  </p>
                  <p className="text-sm opacity-70">{tenant.description || "Your trusted booking platform."}</p>
                </div>
                <div>
                  <p className="font-semibold mb-2" style={{ color: config.theme.textColor }}>Quick Links</p>
                  <Link href={`/book/${tenant.slug}`} className="block text-sm opacity-70 hover:opacity-100 mb-1">
                    Book Now
                  </Link>
                  <Link href={`/business/${tenant.slug}`} className="block text-sm opacity-70 hover:opacity-100 mb-1">
                    About Us
                  </Link>
                </div>
                {tenant.address?.street && (
                  <div>
                    <p className="font-semibold mb-2" style={{ color: config.theme.textColor }}>Contact</p>
                    <p className="text-sm opacity-70">
                      {[tenant.address?.street, tenant.address?.city, tenant.address?.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
              <p className="opacity-50">&copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
            </div>
          ) : (
            <p>&copy; {new Date().getFullYear()} {tenant.name}. Powered by Bokingo.</p>
          )}
        </footer>
      )}
    </div>
  );
}

// ─── Section Renderer ─────────────────────────────────────────────────────────

function SectionRenderer({
  section,
  tenant,
  services,
  config,
}: {
  section: WebsiteSection;
  tenant: Tenant;
  services: Service[];
  config: WebsiteConfig;
}) {
  const cfg = section.config || {};
  const theme = config.theme;
  const maxWidth = config.layout.maxWidth;

  switch (section.type) {
    case "hero":
      return <HeroSection cfg={cfg} tenant={tenant} theme={theme} maxWidth={maxWidth} />;
    case "services":
      return <ServicesSection cfg={cfg} tenant={tenant} services={services} theme={theme} maxWidth={maxWidth} />;
    case "about":
      return <AboutSection cfg={cfg} tenant={tenant} theme={theme} maxWidth={maxWidth} />;
    case "testimonials":
      return <TestimonialsSection cfg={cfg} theme={theme} maxWidth={maxWidth} />;
    case "gallery":
      return <GallerySection cfg={cfg} theme={theme} maxWidth={maxWidth} />;
    case "contact":
      return <ContactSection cfg={cfg} tenant={tenant} theme={theme} maxWidth={maxWidth} />;
    case "faq":
      return <FaqSection cfg={cfg} theme={theme} maxWidth={maxWidth} />;
    case "pricing":
      return <PricingSection cfg={cfg} tenant={tenant} services={services} theme={theme} maxWidth={maxWidth} />;
    case "team":
      return <TeamSection cfg={cfg} theme={theme} maxWidth={maxWidth} />;
    case "cta":
      return <CtaSection cfg={cfg} tenant={tenant} theme={theme} maxWidth={maxWidth} />;
    case "custom":
      return <CustomSection cfg={cfg} theme={theme} maxWidth={maxWidth} />;
    default:
      return null;
  }
}

// ─── Shared props ────────────────────────────────────────────────────────────

interface SectionProps {
  cfg: Record<string, any>;
  theme: WebsiteConfig["theme"];
  maxWidth: string;
}

interface SectionWithTenantProps extends SectionProps {
  tenant: Tenant;
}

interface SectionWithServicesProps extends SectionWithTenantProps {
  services: Service[];
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection({ cfg, tenant, theme, maxWidth }: SectionWithTenantProps) {
  return (
    <section
      className="relative py-28 px-6 text-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.backgroundColor}, ${theme.secondaryColor}15)`,
      }}
    >
      <div className="mx-auto relative z-10" style={{ maxWidth }}>
        <h1
          className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: theme.textColor }}
        >
          {cfg.headline || cfg.title || tenant.name}
        </h1>
        <p
          className="mt-5 text-lg sm:text-xl max-w-2xl mx-auto"
          style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}
        >
          {cfg.subtitle || cfg.subheadline || tenant.description || "Welcome to our business"}
        </p>
        <Link href={`/book/${tenant.slug}`}>
          <Button
            size="lg"
            className="mt-8 text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            style={{
              backgroundColor: theme.primaryColor,
              color: "#fff",
              borderRadius: theme.borderRadius,
            }}
          >
            {cfg.ctaText || "Book Now"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

function ServicesSection({ cfg, tenant, services, theme, maxWidth }: SectionWithServicesProps) {
  const columns = cfg.columns || 3;
  const gridClass =
    columns === 2
      ? "grid-cols-1 md:grid-cols-2"
      : columns === 4
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-20 px-6" id="services">
      <div className="mx-auto" style={{ maxWidth }}>
        <h2 className="text-3xl font-bold text-center mb-3" style={{ color: theme.textColor }}>
          {cfg.title || "Our Services"}
        </h2>
        <p
          className="text-center mb-10 max-w-xl mx-auto"
          style={{ color: `color-mix(in srgb, ${theme.textColor} 60%, transparent)` }}
        >
          Choose from our selection of services and book online
        </p>
        <div className={`grid ${gridClass} gap-6`}>
          {services.map((svc) => (
            <div
              key={svc._id}
              className="group rounded-xl border p-6 transition-all hover:shadow-lg"
              style={{
                borderColor: `color-mix(in srgb, ${theme.textColor} 10%, transparent)`,
                borderRadius: theme.borderRadius,
                backgroundColor: config_mix(theme.backgroundColor, theme.primaryColor, 3),
              }}
            >
              <h3 className="font-semibold text-lg" style={{ color: theme.textColor }}>
                {svc.name}
              </h3>
              {svc.description && (
                <p
                  className="text-sm mt-2 line-clamp-2"
                  style={{ color: `color-mix(in srgb, ${theme.textColor} 60%, transparent)` }}
                >
                  {svc.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: `color-mix(in srgb, ${theme.textColor} 50%, transparent)` }}>
                {cfg.showDuration && svc.defaultDuration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {svc.defaultDuration} min
                  </span>
                )}
                {cfg.showCapacity && svc.maxTotalPlayers && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> Up to {svc.maxTotalPlayers}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-5">
                {cfg.showPrice !== false && (
                  <span className="font-bold text-lg" style={{ color: theme.primaryColor }}>
                    {formatCurrency(svc.price)}
                  </span>
                )}
                <Link href={`/book/${tenant.slug}?service=${svc._id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group-hover:shadow-sm"
                    style={{
                      borderColor: theme.primaryColor,
                      color: theme.primaryColor,
                      borderRadius: theme.borderRadius,
                    }}
                  >
                    Book <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About ───────────────────────────────────────────────────────────────────

function AboutSection({ cfg, tenant, theme, maxWidth }: SectionWithTenantProps) {
  const layout = cfg.layout || "centered";

  return (
    <section
      className="py-20 px-6"
      style={{ backgroundColor: config_mix(theme.backgroundColor, theme.textColor, 3) }}
    >
      <div className="mx-auto" style={{ maxWidth }}>
        {layout === "side-by-side" ? (
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: theme.textColor }}>
                {cfg.title || "About Us"}
              </h2>
              <p
                className="leading-relaxed text-base"
                style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}
              >
                {cfg.content || tenant.description || "We provide the best booking experience for our customers."}
              </p>
            </div>
            {cfg.showImage && (
              <div
                className="aspect-video rounded-xl overflow-hidden"
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 10%, ${theme.backgroundColor})`,
                  borderRadius: theme.borderRadius,
                }}
              >
                <div className="h-full w-full flex items-center justify-center text-4xl opacity-30">
                  🏢
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4" style={{ color: theme.textColor }}>
              {cfg.title || "About Us"}
            </h2>
            <p
              className="leading-relaxed text-base"
              style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}
            >
              {cfg.content || tenant.description || "We provide the best booking experience for our customers."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────

function TestimonialsSection({ cfg, theme, maxWidth }: SectionProps) {
  const items = cfg.items || [];
  if (items.length === 0) return null;

  return (
    <section className="py-20 px-6">
      <div className="mx-auto" style={{ maxWidth }}>
        <h2 className="text-3xl font-bold text-center mb-3" style={{ color: theme.textColor }}>
          {cfg.title || "What Our Customers Say"}
        </h2>
        <p
          className="text-center mb-10 max-w-xl mx-auto"
          style={{ color: `color-mix(in srgb, ${theme.textColor} 60%, transparent)` }}
        >
          Don&apos;t just take our word for it
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item: any, i: number) => (
            <div
              key={i}
              className="rounded-xl border p-6"
              style={{
                borderColor: `color-mix(in srgb, ${theme.textColor} 10%, transparent)`,
                borderRadius: theme.borderRadius,
              }}
            >
              <div className="flex mb-3">
                {Array.from({ length: item.rating || 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p
                className="text-sm italic leading-relaxed"
                style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}
              >
                &ldquo;{item.text}&rdquo;
              </p>
              <p className="text-sm font-medium mt-4" style={{ color: theme.textColor }}>
                — {item.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

function GallerySection({ cfg, theme, maxWidth }: SectionProps) {
  const images = cfg.images || [];

  return (
    <section className="py-20 px-6">
      <div className="mx-auto" style={{ maxWidth }}>
        <h2 className="text-3xl font-bold text-center mb-10" style={{ color: theme.textColor }}>
          {cfg.title || "Gallery"}
        </h2>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img: string, i: number) => (
              <div
                key={i}
                className="aspect-video rounded-xl overflow-hidden"
                style={{ borderRadius: theme.borderRadius }}
              >
                <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-video rounded-xl flex items-center justify-center text-3xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.primaryColor} ${8 + i * 3}%, ${theme.backgroundColor})`,
                  borderRadius: theme.borderRadius,
                }}
              >
                <span className="opacity-30">📸</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Contact ─────────────────────────────────────────────────────────────────

function ContactSection({ cfg, tenant, theme, maxWidth }: SectionWithTenantProps) {
  return (
    <section
      className="py-20 px-6"
      style={{ backgroundColor: config_mix(theme.backgroundColor, theme.textColor, 3) }}
    >
      <div className="mx-auto" style={{ maxWidth }}>
        <h2 className="text-3xl font-bold text-center mb-10" style={{ color: theme.textColor }}>
          {cfg.title || "Contact Us"}
        </h2>
        <div className="max-w-lg mx-auto space-y-4">
          {tenant.address?.street && (
            <div className="flex items-center gap-3" style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}>
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 10%, ${theme.backgroundColor})` }}
              >
                <MapPin className="h-5 w-5" style={{ color: theme.primaryColor }} />
              </div>
              <span>
                {[tenant.address?.street, tenant.address?.city, tenant.address?.state]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
          {cfg.phone && (
            <div className="flex items-center gap-3" style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}>
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 10%, ${theme.backgroundColor})` }}
              >
                <Phone className="h-5 w-5" style={{ color: theme.primaryColor }} />
              </div>
              <span>{cfg.phone}</span>
            </div>
          )}
          {cfg.email && (
            <div className="flex items-center gap-3" style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}>
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 10%, ${theme.backgroundColor})` }}
              >
                <Mail className="h-5 w-5" style={{ color: theme.primaryColor }} />
              </div>
              <span>{cfg.email}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FaqSection({ cfg, theme, maxWidth }: SectionProps) {
  const items = cfg.items || [];
  if (items.length === 0) return null;

  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-3xl" style={{ maxWidth: `min(${maxWidth}, 48rem)` }}>
        <h2 className="text-3xl font-bold text-center mb-10" style={{ color: theme.textColor }}>
          {cfg.title || "FAQ"}
        </h2>
        <div className="space-y-3">
          {items.map((item: any, i: number) => (
            <FaqItem key={i} item={item} theme={theme} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ item, theme }: { item: any; theme: WebsiteConfig["theme"] }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        borderColor: `color-mix(in srgb, ${theme.textColor} 10%, transparent)`,
        borderRadius: theme.borderRadius,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ color: theme.textColor }}
      >
        <span className="font-medium">{item.question || item.q}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
          style={{ color: `color-mix(in srgb, ${theme.textColor} 50%, transparent)` }}
        />
      </button>
      {open && (
        <div
          className="px-5 pb-5 text-sm leading-relaxed"
          style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}
        >
          {item.answer || item.a}
        </div>
      )}
    </div>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function PricingSection({ cfg, tenant, services, theme, maxWidth }: SectionWithServicesProps) {
  return (
    <section
      className="py-20 px-6"
      style={{ backgroundColor: config_mix(theme.backgroundColor, theme.textColor, 3) }}
    >
      <div className="mx-auto" style={{ maxWidth }}>
        <h2 className="text-3xl font-bold text-center mb-3" style={{ color: theme.textColor }}>
          {cfg.title || "Pricing"}
        </h2>
        <p
          className="text-center mb-10 max-w-xl mx-auto"
          style={{ color: `color-mix(in srgb, ${theme.textColor} 60%, transparent)` }}
        >
          Transparent pricing with no hidden fees
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((svc, i) => (
            <div
              key={svc._id}
              className="rounded-xl border p-8 text-center relative"
              style={{
                borderColor:
                  i === 1
                    ? theme.primaryColor
                    : `color-mix(in srgb, ${theme.textColor} 10%, transparent)`,
                borderWidth: i === 1 ? "2px" : "1px",
                borderRadius: theme.borderRadius,
                backgroundColor: theme.backgroundColor,
              }}
            >
              {i === 1 && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Popular
                </div>
              )}
              <h3 className="font-semibold text-lg" style={{ color: theme.textColor }}>
                {svc.name}
              </h3>
              <p
                className="text-4xl font-bold mt-4"
                style={{ color: theme.primaryColor }}
              >
                {formatCurrency(svc.price)}
              </p>
              <p
                className="text-sm mt-2"
                style={{ color: `color-mix(in srgb, ${theme.textColor} 50%, transparent)` }}
              >
                {svc.defaultDuration} min · Max {svc.maxTotalPlayers} players
              </p>
              {svc.description && (
                <p
                  className="text-sm mt-3 line-clamp-2"
                  style={{ color: `color-mix(in srgb, ${theme.textColor} 60%, transparent)` }}
                >
                  {svc.description}
                </p>
              )}
              <Link href={`/book/${tenant.slug}?service=${svc._id}`}>
                <Button
                  className="mt-6 w-full"
                  variant={i === 1 ? "default" : "outline"}
                  style={
                    i === 1
                      ? { backgroundColor: theme.primaryColor, color: "#fff", borderRadius: theme.borderRadius }
                      : { borderColor: theme.primaryColor, color: theme.primaryColor, borderRadius: theme.borderRadius }
                  }
                >
                  Book Now
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Team ────────────────────────────────────────────────────────────────────

function TeamSection({ cfg, theme, maxWidth }: SectionProps) {
  const members = cfg.members || [];

  return (
    <section className="py-20 px-6">
      <div className="mx-auto" style={{ maxWidth }}>
        <h2 className="text-3xl font-bold text-center mb-10" style={{ color: theme.textColor }}>
          {cfg.title || "Our Team"}
        </h2>
        {members.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {members.map((m: any, i: number) => (
              <div key={i} className="text-center">
                <div
                  className="h-24 w-24 rounded-full mx-auto flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 15%, ${theme.backgroundColor})`,
                    color: theme.primaryColor,
                  }}
                >
                  {m.name?.charAt(0) || "?"}
                </div>
                <p className="font-medium mt-4" style={{ color: theme.textColor }}>
                  {m.name}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: `color-mix(in srgb, ${theme.textColor} 50%, transparent)` }}
                >
                  {m.role}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div
                  className="h-24 w-24 rounded-full mx-auto flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 10%, ${theme.backgroundColor})`,
                  }}
                >
                  <span className="opacity-30">👤</span>
                </div>
                <p className="font-medium mt-4 opacity-30" style={{ color: theme.textColor }}>
                  Team Member
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CtaSection({ cfg, tenant, theme, maxWidth }: SectionWithTenantProps) {
  return (
    <section
      className="py-24 px-6 text-center"
      style={{ backgroundColor: theme.primaryColor }}
    >
      <div className="mx-auto max-w-2xl" style={{ maxWidth: `min(${maxWidth}, 42rem)` }}>
        <h2 className="text-3xl font-bold text-white">
          {cfg.title || "Ready to Book?"}
        </h2>
        <p className="mt-4 text-white/80 text-lg">
          {cfg.subtitle || "Reserve your spot now!"}
        </p>
        <Link href={`/book/${tenant.slug}`}>
          <Button
            size="lg"
            className="mt-8 text-base px-8 shadow-lg"
            style={{
              backgroundColor: "#fff",
              color: theme.primaryColor,
              borderRadius: theme.borderRadius,
            }}
          >
            {cfg.buttonText || "Book Now"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

// ─── Custom Section (content-based, no raw HTML) ─────────────────────────────

function CustomSection({ cfg, theme, maxWidth }: SectionProps) {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-3xl" style={{ maxWidth: `min(${maxWidth}, 48rem)` }}>
        {cfg.title && (
          <h2 className="text-3xl font-bold text-center mb-6" style={{ color: theme.textColor }}>
            {cfg.title}
          </h2>
        )}
        {cfg.content && (
          <p
            className="text-center leading-relaxed"
            style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}
          >
            {cfg.content}
          </p>
        )}
      </div>
    </section>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function config_mix(base: string, mix: string, percent: number): string {
  return `color-mix(in srgb, ${mix} ${percent}%, ${base})`;
}
