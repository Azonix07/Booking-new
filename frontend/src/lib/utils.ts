import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Safe localStorage wrapper for Node 25+ SSR (where localStorage exists but is broken) */
function isBrowserStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (!isBrowserStorage()) return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): void {
    if (!isBrowserStorage()) return;
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem(key: string): void {
    if (!isBrowserStorage()) return;
    try { localStorage.removeItem(key); } catch {}
  },
};

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function getSlotColor(status: string): string {
  switch (status) {
    case "available": return "var(--slot-available)";
    case "filling": return "var(--slot-filling)";
    case "full": return "var(--slot-full)";
    case "blocked": return "var(--slot-blocked)";
    default: return "var(--slot-blocked)";
  }
}

export function getSlotBorderColor(status: string): string {
  switch (status) {
    case "available": return "var(--slot-available)";
    case "filling": return "var(--slot-filling)";
    case "full": return "var(--slot-full)";
    case "blocked": return "var(--slot-blocked)";
    default: return "var(--slot-blocked)";
  }
}
