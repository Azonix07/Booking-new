"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LocationSearch, type PlaceSuggestion } from "@/components/location-search";

const LINKS = [
  { href: "/list-your-business", label: "For Business" },
];

interface NavbarProps {
  onLocationChange?: (place: PlaceSuggestion | null) => void;
}

export function Navbar({ onLocationChange }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const pathname = usePathname();
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClear = () => {
      setSelectedPlace(null);
      onLocationChange?.(null);
    };
    const handleFocus = () => {
      locationRef.current?.querySelector("input")?.focus();
    };
    window.addEventListener("clear-navbar-location", handleClear);
    window.addEventListener("focus-navbar-location", handleFocus);
    return () => {
      window.removeEventListener("clear-navbar-location", handleClear);
      window.removeEventListener("focus-navbar-location", handleFocus);
    };
  }, [onLocationChange]);

  const handleLocationSelect = (place: PlaceSuggestion) => {
    setSelectedPlace(place);
    onLocationChange?.(place);
    window.dispatchEvent(new CustomEvent("navbar-location-change", { detail: place }));
  };

  const handleClearLocation = () => {
    setSelectedPlace(null);
    onLocationChange?.(null);
    window.dispatchEvent(new CustomEvent("navbar-location-change", { detail: null }));
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_20px_-8px_rgba(0,0,0,0.08)] border-b border-border/50"
          : "bg-white/70 backdrop-blur-md border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* LEFT: Logo only */}
        <Link href="/" className="group flex items-center shrink-0 relative">
          <span className="absolute inset-0 -m-2 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
          <Image
            src="/images/brand/Bokingo_small.png"
            alt="Bokingo"
            width={36}
            height={36}
            className="sm:hidden relative"
            priority
          />
          <Image
            src="/images/brand/Bokingo_large.png"
            alt="Bokingo"
            width={120}
            height={32}
            className="hidden sm:block relative transition-transform duration-300 group-hover:scale-[1.02]"
            priority
          />
        </Link>

        {/* RIGHT: Everything — location, nav, auth — pushed to the right */}
        <div className="hidden md:flex items-center gap-3">
          {/* Compact location pill */}
          <div ref={locationRef} className="w-56 lg:w-64">
            <div className="relative group">
              <LocationSearch
                value={selectedPlace}
                onSelect={handleLocationSelect}
                placeholder="Location..."
                size="sm"
                showCurrentLocation
                className="w-full"
              />
              {selectedPlace && (
                <button
                  onClick={handleClearLocation}
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
                  aria-label="Clear location"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <span className="h-6 w-px bg-border/60" />

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href.split("?")[0];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Auth area */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border/60">
              {(user?.role === "client_admin" || user?.role === "super_admin") && (
                <Link href={user.role === "super_admin" ? "/admin" : "/dashboard"}>
                  <Button variant="outline" size="sm" className="gap-2 rounded-lg h-9">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white text-sm font-semibold shadow-md shadow-primary/20 ring-2 ring-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary h-9">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-lg shadow-md shadow-primary/20 hover:shadow-primary/30 h-9 px-4">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-3">
            <LocationSearch
              value={selectedPlace}
              onSelect={(place) => { handleLocationSelect(place); setMobileOpen(false); }}
              placeholder="Search location..."
              size="sm"
              showCurrentLocation
              className="w-full"
            />

            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                {(user?.role === "client_admin" || user?.role === "super_admin") && (
                  <Link
                    href={user.role === "super_admin" ? "/admin" : "/dashboard"}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
