"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
  Crown,
  Zap,
  Building2,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubscriptionRequest {
  _id: string;
  tenantId: { _id: string; name: string; slug: string; category: string } | null;
  userId: { _id: string; name: string; email: string; phone?: string } | null;
  plan: "free" | "standard" | "ai" | "full_service";
  status: "pending" | "active" | "rejected" | "expired";
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

const planConfig = {
  free: { label: "Free", icon: Zap, color: "text-slate-600 bg-slate-50", badge: "bg-slate-100 text-slate-700 border border-slate-200" },
  standard: { label: "Standard", icon: Building2, color: "text-blue-600 bg-blue-50", badge: "bg-blue-100 text-blue-700 border border-blue-200" },
  ai: { label: "AI Plan", icon: Sparkles, color: "text-purple-600 bg-purple-50", badge: "bg-purple-100 text-purple-700 border border-purple-200" },
  full_service: { label: "Full-Service", icon: Crown, color: "text-amber-600 bg-amber-50", badge: "bg-amber-100 text-amber-700 border border-amber-200" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-amber-700 bg-amber-100" },
  active: { label: "Active", color: "text-green-700 bg-green-100" },
  rejected: { label: "Rejected", color: "text-red-700 bg-red-100" },
  expired: { label: "Expired", color: "text-gray-700 bg-gray-100" },
};

export default function AdminSubscriptionsPage() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : "";
      const res = await api.get<any>(`/subscriptions/admin/requests${params}`);
      setRequests(res?.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await api.put(`/subscriptions/admin/${id}/approve`, {});
      fetchRequests();
    } catch {
      // error
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setProcessing(rejectId);
    try {
      await api.put(`/subscriptions/admin/${rejectId}/reject`, { reason: rejectReason });
      setRejectId(null);
      setRejectReason("");
      fetchRequests();
    } catch {
      // error
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Requests</h1>
        <p className="text-muted-foreground">Manage business subscription requests</p>
      </div>

      {/* Filters */}
      <div className="inline-flex p-1 bg-muted/50 rounded-xl gap-1">
        {["pending", "active", "rejected", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              filter === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="rounded-xl border-border/60">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">No subscription requests found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Requests will appear here when businesses apply for plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {requests.map((req, index) => {
              const plan = planConfig[req.plan] || planConfig.free;
              const status = statusConfig[req.status] || statusConfig.pending;
              const PlanIcon = plan.icon;
              const initial = req.tenantId?.name?.charAt(0)?.toUpperCase() || "?";

              return (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="rounded-xl border-border/60 transition-colors hover:border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: info */}
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                            {initial}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-xl font-medium ${plan.badge}`}>
                                <PlanIcon className="h-3 w-3" />
                                {plan.label}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {req.tenantId?.name || "Unknown"}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {req.userId?.name || "Unknown"} ({req.userId?.email})
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Requested: {new Date(req.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                            </div>
                            {req.rejectionReason && (
                              <p className="text-xs text-destructive mt-1">
                                Rejection: {req.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: actions */}
                        {req.status === "pending" && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req._id)}
                              disabled={processing === req._id}
                              className="gap-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-sm"
                            >
                              {processing === req._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectId(req._id)}
                              disabled={processing === req._id}
                              className="gap-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {req.status === "active" && req.approvedAt && (
                          <div className="text-xs text-muted-foreground text-right">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approved
                            </span>
                            {new Date(req.approvedAt).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Rejection modal */}
      <AnimatePresence>
        {rejectId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md mx-4"
            >
              <Card className="rounded-xl border-border/60 shadow-lg">
                <CardHeader>
                  <CardTitle>Reject Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Rejection Reason</label>
                    <textarea
                      className="w-full rounded-xl border border-border/60 p-3 text-sm min-h-[100px] resize-none bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="Provide a reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" className="rounded-xl" onClick={() => { setRejectId(null); setRejectReason(""); }}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-xl"
                      disabled={!rejectReason.trim() || processing === rejectId}
                      onClick={handleReject}
                    >
                      {processing === rejectId ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
