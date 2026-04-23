"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  FullServiceRequest,
  FullServiceRequestStatus,
} from "@/lib/types";

interface PopulatedRef {
  _id: string;
  name?: string;
  email?: string;
  slug?: string;
}

type AdminRequest = Omit<
  FullServiceRequest,
  "assignedTo"
> & {
  _id: string;
  tenantId?: PopulatedRef | null;
  requestedBy?: PopulatedRef | null;
  assignedTo?: PopulatedRef | null;
  updatedAt?: string;
};

interface ListResponse {
  data: AdminRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<FullServiceRequestStatus, number>;
}

type StatusFilter = FullServiceRequestStatus | "all";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "contacted", label: "Contacted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

const STATUS_CONFIG: Record<
  FullServiceRequestStatus,
  { label: string; badge: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  contacted: {
    label: "Contacted",
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-purple-100 text-purple-700 border border-purple-200",
  },
  completed: {
    label: "Completed",
    badge: "bg-green-100 text-green-700 border border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
  },
};

const ALLOWED_TRANSITIONS: Record<
  FullServiceRequestStatus,
  FullServiceRequestStatus[]
> = {
  pending: ["contacted", "cancelled"],
  contacted: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: ["pending"],
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBudget(budget: number | null) {
  if (budget === null || budget === undefined) return "Not specified";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(budget);
}

export default function AdminFullServicePage() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter !== "all") q.set("status", filter);
      if (search.trim()) q.set("search", search.trim());
      const res = await api.get<ListResponse>(
        `/full-service-requests/admin?${q.toString()}`,
      );
      setRequests(res?.data || []);
      setCounts(res?.statusCounts || {});
    } catch {
      setRequests([]);
      setCounts({});
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Full-Service Requests</h1>
          <p className="text-muted-foreground">
            Custom-build requests from businesses — triage, contact, and track.
          </p>
        </div>
        <div className="flex-1 max-w-xs">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business name or email..."
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
      </div>

      <div className="inline-flex p-1 bg-muted/50 rounded-xl gap-1 overflow-x-auto max-w-full">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? Object.values(counts).reduce((a, b) => a + b, 0)
              : counts[tab.key] ?? 0;
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold rounded-full ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="rounded-xl border-border/60">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  No requests found
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  New Full-Service requests will appear here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {requests.map((req, i) => {
              const cfg = STATUS_CONFIG[req.status];
              const initial =
                req.businessName?.charAt(0)?.toUpperCase() || "?";
              return (
                <motion.div
                  key={req._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Card
                    className="rounded-xl border-border/60 transition-all cursor-pointer hover:border-border hover:shadow-md"
                    onClick={() => setSelected(req)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                            {initial}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-base truncate">
                                {req.businessName}
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {req.businessType}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {req.contact?.email}
                              </span>
                              {req.budget !== null && req.budget !== undefined && (
                                <span className="font-medium text-foreground/70">
                                  Budget: {formatBudget(req.budget)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Submitted {formatDate(req.createdAt)}
                              {req.assignedTo?.name && (
                                <>
                                  {" · Assigned to "}
                                  <span className="font-medium text-foreground/80">
                                    {req.assignedTo.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(req);
                          }}
                        >
                          View details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <RequestDetailModal
            request={selected}
            onClose={() => setSelected(null)}
            onUpdated={(updated) => {
              setRequests((prev) =>
                prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)),
              );
              setSelected(updated);
              fetchRequests();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RequestDetailModal({
  request,
  onClose,
  onUpdated,
}: {
  request: AdminRequest;
  onClose: () => void;
  onUpdated: (r: AdminRequest) => void;
}) {
  const [status, setStatus] = useState<FullServiceRequestStatus>(
    request.status,
  );
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || "");
  const [deliveredDomain, setDeliveredDomain] = useState(
    request.deliveredDomain || "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allowedNext = ALLOWED_TRANSITIONS[request.status];
  const statusOptions: FullServiceRequestStatus[] = [
    request.status,
    ...allowedNext.filter((s) => s !== request.status),
  ];

  const canSave =
    status !== request.status ||
    adminNotes !== (request.adminNotes || "") ||
    deliveredDomain !== (request.deliveredDomain || "");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.put<AdminRequest>(
        `/full-service-requests/admin/${request._id}/status`,
        {
          status,
          adminNotes: adminNotes || undefined,
          deliveredDomain: deliveredDomain || undefined,
        },
      );
      onUpdated(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="rounded-2xl border-border/60 shadow-2xl">
          <div className="flex items-start justify-between p-6 border-b border-border/60 sticky top-0 bg-background z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold">{request.businessName}</h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[request.status].badge}`}
                >
                  {STATUS_CONFIG[request.status].label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {request.businessType} · Submitted {formatDate(request.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <CardContent className="p-6 space-y-6">
            <DetailSection title="Contact">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <InfoItem icon={User} label="Name" value={request.contact.name} />
                <InfoItem icon={Mail} label="Email" value={request.contact.email} />
                <InfoItem icon={Phone} label="Phone" value={request.contact.phone} />
              </div>
            </DetailSection>

            <DetailSection title="Project details">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {request.businessDescription}
                  </p>
                </div>
                {request.features && request.features.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Requested features
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {request.features.map((f) => (
                        <span
                          key={f}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {request.designPreferences && (
                    <InfoBlock label="Design preferences" value={request.designPreferences} />
                  )}
                  {request.targetAudience && (
                    <InfoBlock label="Target audience" value={request.targetAudience} />
                  )}
                  {request.existingWebsite && (
                    <InfoBlock label="Existing website" value={request.existingWebsite} />
                  )}
                  <InfoBlock label="Budget" value={formatBudget(request.budget)} />
                  {request.timeline && (
                    <InfoBlock label="Timeline" value={request.timeline} />
                  )}
                  {request.additionalNotes && (
                    <InfoBlock label="Additional notes" value={request.additionalNotes} />
                  )}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Timeline">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <TimelineItem
                  icon={Clock}
                  label="Submitted"
                  date={request.createdAt}
                  active
                />
                <TimelineItem
                  icon={Mail}
                  label="Contacted"
                  date={request.contactedAt}
                  active={!!request.contactedAt}
                />
                <TimelineItem
                  icon={Sparkles}
                  label="Started"
                  date={request.startedAt}
                  active={!!request.startedAt}
                />
                <TimelineItem
                  icon={CheckCircle2}
                  label="Completed"
                  date={request.completedAt}
                  active={!!request.completedAt}
                />
              </div>
            </DetailSection>

            <DetailSection title="Manage">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      const active = status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            active
                              ? cfg.badge + " ring-2 ring-offset-1 ring-primary/40"
                              : "border-border/70 bg-background hover:border-primary/40"
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                  {allowedNext.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      This request is in a terminal state — no further transitions allowed.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    Admin notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Internal notes (not visible to the business)..."
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                  />
                </div>

                {(status === "completed" || request.deliveredDomain) && (
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      <Globe className="h-3.5 w-3.5 inline mr-1" />
                      Delivered domain
                    </label>
                    <input
                      type="url"
                      value={deliveredDomain}
                      onChange={(e) => setDeliveredDomain(e.target.value)}
                      maxLength={200}
                      placeholder="https://yourbusiness.com"
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                  <Button
                    className="rounded-xl bg-primary border-0 text-white"
                    disabled={!canSave || saving}
                    onClick={handleSave}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save changes
                  </Button>
                </div>
              </div>
            </DetailSection>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  date,
  active,
}: {
  icon: React.ElementType;
  label: string;
  date: string | null | undefined;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        active
          ? "border-primary/30 bg-primary/5"
          : "border-border/50 bg-muted/20 text-muted-foreground"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : ""}`} />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-xs mt-1">{date ? formatDate(date) : "—"}</p>
    </div>
  );
}
