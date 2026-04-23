"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Mail,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";

interface BusinessCredential {
  _id: string;
  name: string;
  slug: string;
  category: string;
  plan: string;
  status: string;
  isPublished: boolean;
  address?: { city?: string; state?: string };
  rating?: { average: number; count: number };
  ownerId?: { _id: string; name: string; email: string; phone?: string } | null;
  bookingsCount?: number;
  servicesCount?: number;
  createdAt: string;
}

const DEMO_PASSWORD = "Demo@1234";

export default function AdminCredentialsPage() {
  const [businesses, setBusinesses] = useState<BusinessCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "50");
      const res = await api.get<any>(`/admin/tenants?${params}`);
      setBusinesses(res?.data || []);
      setTotalPages(res?.pagination?.totalPages || 1);
      setTotal(res?.pagination?.total || 0);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchBusinesses, 300);
    return () => clearTimeout(debounce);
  }, [fetchBusinesses]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case "free": return "bg-gray-100 text-gray-700";
      case "standard": return "bg-blue-100 text-blue-700";
      case "ai": return "bg-violet-100 text-violet-700";
      case "full_service": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Credentials"
        description={`View login credentials for all ${total} registered businesses`}
      />

      {/* Info banner */}
      <Card className="rounded-xl border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Key className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Admin Access</p>
            <p className="text-amber-700 mt-0.5">
              All demo/seeded businesses use the password <code className="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">{DEMO_PASSWORD}</code>.
              Use the owner email below to log in as any business owner.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search + password toggle */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 rounded-xl h-10"
            placeholder="Search by name, category, city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPassword ? "Hide Passwords" : "Show Passwords"}
        </Button>
      </div>

      {/* Credential cards */}
      {loading ? (
        <PageLoader />
      ) : businesses.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No businesses found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {businesses.map((biz, i) => {
            const ownerEmail = biz.ownerId && typeof biz.ownerId === "object" ? biz.ownerId.email : "—";
            const ownerName = biz.ownerId && typeof biz.ownerId === "object" ? biz.ownerId.name : "—";
            const ownerPhone = biz.ownerId && typeof biz.ownerId === "object" ? biz.ownerId.phone : "";

            return (
              <motion.div
                key={biz._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.02 }}
              >
                <Card className="rounded-xl border-border/60 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Business info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                          {biz.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{biz.name}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${planColor(biz.plan)}`}>
                              {biz.plan}
                            </span>
                            <Badge variant={biz.status === "active" ? "default" : "outline"} className="text-[10px]">
                              {biz.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            <span className="capitalize">{biz.category?.replace(/-/g, " ")}</span>
                            {biz.address?.city && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {biz.address.city}
                              </span>
                            )}
                            {biz.bookingsCount !== undefined && <span>{biz.bookingsCount} bookings</span>}
                          </div>
                        </div>
                      </div>

                      {/* Credentials */}
                      <div className="flex flex-col sm:items-end gap-1.5 sm:text-right sm:min-w-[280px]">
                        {/* Email */}
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-mono text-foreground">{ownerEmail}</span>
                          <button
                            onClick={() => copyToClipboard(ownerEmail, biz._id + "-email")}
                            className="p-0.5 rounded hover:bg-muted transition-colors"
                            title="Copy email"
                          >
                            {copiedId === biz._id + "-email" ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        {/* Password */}
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-mono text-foreground">
                            {showPassword ? DEMO_PASSWORD : "••••••••"}
                          </span>
                          <button
                            onClick={() => copyToClipboard(DEMO_PASSWORD, biz._id + "-pwd")}
                            className="p-0.5 rounded hover:bg-muted transition-colors"
                            title="Copy password"
                          >
                            {copiedId === biz._id + "-pwd" ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        {/* Owner name + phone */}
                        <div className="text-[11px] text-muted-foreground">
                          Owner: {ownerName}
                          {ownerPhone && <> · {ownerPhone}</>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-8 w-8"
                          onClick={() => window.open(`/book/${biz.slug}`, "_blank")}
                          title="View booking page"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
