"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Globe, Settings, Calendar, Palette, Box, Clock,
  BarChart3, Star, LogOut, Lock, Zap, ChevronLeft, Menu, type LucideIcon,
} from "lucide-react";
import { useState } from "react";

type SidebarItem = { label: string; href: string; icon: LucideIcon; requiresPlan?: string[] };

const sidebarItems: SidebarItem[] = [
  { label: "Overview",     href: "/dashboard",                icon: LayoutDashboard },
  { label: "Bookings",     href: "/dashboard/bookings",       icon: Calendar },
  { label: "Services",     href: "/dashboard/services",       icon: Box },
  { label: "Time Slots",   href: "/dashboard/slots",          icon: Clock },
  { label: "Reviews",      href: "/dashboard/reviews",        icon: Star },
  { label: "Website (AI)", href: "/dashboard/website",        icon: Globe, requiresPlan: ["ai", "full_service"] },
  { label: "Appearance",   href: "/dashboard/website/editor", icon: Palette, requiresPlan: ["standard", "ai", "full_service"] },
  { label: "Analytics",    href: "/dashboard/analytics",      icon: BarChart3 },
  { label: "Settings",     href: "/dashboard/settings",       icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const currentPlan = user?.onboarding?.subscription?.plan || "free";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white border-r transition-all duration-200",
        collapsed ? "w-[64px]" : "w-[240px]",
        "hidden lg:flex",
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center h-16 border-b px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-white shadow-sm shadow-primary/25">
              <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm">Dashboard</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isLocked = item.requiresPlan && !item.requiresPlan.includes(currentPlan);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={isLocked ? "#" : item.href}
              onClick={isLocked ? (e) => e.preventDefault() : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isLocked ? "text-muted-foreground/50 cursor-not-allowed"
                  : isActive ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {isLocked && <Lock className="h-3 w-3 ml-auto text-muted-foreground/40" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2 space-y-2">
        {user && !collapsed && (
          <div className="px-3 py-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-muted-foreground text-[11px] truncate">{user.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-primary/8 text-primary">
              {currentPlan} plan
            </span>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium w-full",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
