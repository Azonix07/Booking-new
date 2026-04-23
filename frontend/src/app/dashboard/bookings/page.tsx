"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, X, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Booking, PaginatedResponse } from "@/lib/types";

export default function BookingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Booking> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const fetchBookings = useCallback(async () => {
    if (!user?.tenantId) return;
    api.setTenantId(user.tenantId);
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (search) params.set("search", search);

      const res = await api.get<PaginatedResponse<Booking>>(`/dashboard/bookings?${params}`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user, page, status, search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const bookings = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader title="Bookings" description="Manage all your bookings" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 h-10 rounded-xl"
            placeholder="Search by ref or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchBookings()}
          />
        </div>
        <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl">
          {["", "confirmed", "completed", "cancelled"].map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "ghost"}
              size="sm"
              className={`rounded-lg text-xs ${status === s ? "shadow-sm" : ""}`}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s || "All"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No bookings found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {bookings.map((b, i) => (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-border/60 card-hover">
                  <CardContent className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary text-sm font-semibold shrink-0">
                        {typeof b.customerId === "object" ? b.customerId.name?.charAt(0)?.toUpperCase() : "C"}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{b.bookingRef}</span>
                          <Badge
                            variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}
                            className="text-[11px] rounded-md"
                          >
                            {b.status}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm truncate">
                          {typeof b.customerId === "object" ? b.customerId.name : "Customer"} &middot;{" "}
                          {typeof b.serviceId === "object" ? b.serviceId.name : "Service"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.date} &middot; {b.startTime}&ndash;{b.endTime} &middot; {b.numberOfPersons} player(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-sm">{formatCurrency(b.totalAmount)}</p>
                      {b.status === "confirmed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive text-xs mt-1 h-7 px-2 rounded-lg"
                          onClick={async () => {
                            try {
                              await api.put(`/bookings/${b._id}/cancel`);
                              fetchBookings();
                            } catch {}
                          }}
                        >
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-xl">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
