"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  LogOut,
  Shield,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const sidebarItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Businesses", href: "/admin/tenants", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Credentials", href: "/admin/credentials", icon: KeyRound },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Full-Service", href: "/admin/full-service", icon: Sparkles },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="hidden lg:flex w-[260px] flex-col border-r border-border/60 bg-card">
      <div className="flex h-16 items-center border-b border-border/60 px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base">Super Admin</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "sidebar-item-active"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-white")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 p-3 space-y-3">
        <div className="px-3 py-2">
          <p className="font-semibold text-sm">{user?.name}</p>
          <p className="text-muted-foreground text-xs mt-0.5">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
