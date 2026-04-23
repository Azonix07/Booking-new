"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Menu, X, MapPin } from "lucide-react";
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

  // Listen for clear/focus events from homepage
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
    // Also dispatch event for non-prop listeners
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
          ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-border/60"
          : "bg-white/50 backdrop-blur-sm border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 gap-3">
        {/* Logo */}
        <Link href="/" className="mr-2 flex items-center shrink-0">
          <Image
            src="/images/brand/Bokingo_small.png"
            alt="Bokingo"
            width={36}
            height={36}
            className="sm:hidden"
          />
          <Image
            src="/images/brand/Bokingo_large.png"
            alt="Bokingo"
            width={120}
            height={32}
            className="hidden sm:block"
          />
        </Link>

        {/* Location search in navbar */}
        <div ref={locationRef} className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <LocationSearch
              value={selectedPlace}
              onSelect={handleLocationSelect}
              placeholder="Search location..."
              size="sm"
              showCurrentLocation
              className="w-full"
            />
            {selectedPlace && (
              <button
                onClick={handleClearLocation}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 md:flex-none" />

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href.split("?")[0];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {(user?.role === "client_admin" || user?.role === "super_admin") && (
                <Link href={user.role === "super_admin" ? "/admin" : "/dashboard"}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2 ml-2 pl-3 border-l">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden lg:inline">
                  {user?.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
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
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-2">
            {/* Mobile location search */}
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
                className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                {(user?.role === "client_admin" || user?.role === "super_admin") && (
                  <Link
                    href={user.role === "super_admin" ? "/admin" : "/dashboard"}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
