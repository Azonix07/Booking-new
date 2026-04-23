"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  ExternalLink,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarCheck,
  Star,
  IndianRupee,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminTenant {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  plan: string;
  isPublished: boolean;
  rating: { average: number; count: number };
  address?: { street?: string; city?: string; state?: string; zip?: string; country?: string };
  branding?: { primaryColor?: string };
  ownerId?: { _id: string; name: string; email: string; phone?: string } | null;
  bookingsCount?: number;
  servicesCount?: number;
  reviewsCount?: number;
  usersCount?: number;
  totalRevenue?: number;
  services?: any[];
  createdAt: string;
  tags?: string[];
  businessHours?: any[];
  shopSettings?: any;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState<AdminTenant | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await api.get<any>(`/admin/tenants?${params}`);
      setTenants(res?.data || []);
      setTotalPages(res?.pagination?.totalPages || 1);
      setTotal(res?.pagination?.total || 0);
    } catch {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchTenants, 300);
    return () => clearTimeout(debounce);
  }, [fetchTenants]);

  const viewTenant = async (id: string) => {
    try {
      const res = await api.get<any>(`/admin/tenants/${id}`);
      setSelected(res);
      setEditing(false);
    } catch {}
  };

  const startEdit = (t: AdminTenant) => {
    setEditForm({
      name: t.name,
      description: t.description || "",
      category: t.category,
      status: t.status,
      plan: t.plan,
      isPublished: t.isPublished,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/admin/tenants/${selected._id}`, editForm);
      setEditing(false);
      setSelected(null);
      fetchTenants();
    } catch {}
    setSaving(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await api.put(`/admin/tenants/${id}/status`, { status: newStatus });
      fetchTenants();
    } catch {}
  };

  const deleteTenant = async (id: string) => {
    if (!confirm("Delete this business and ALL its data (bookings, services, reviews, users)? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/tenants/${id}`);
      setSelected(null);
      fetchTenants();
    } catch {}
    setDeleting(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return "default" as const;
      case "suspended": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Businesses" description={`Manage all platform businesses (${total} total)`} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 rounded-xl h-10"
            placeholder="Search by name, slug, category..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          {["", "active", "pending_setup", "suspended"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "ghost"}
              size="sm"
              className="rounded-lg capitalize"
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s === "" ? "All" : s.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Tenant list */}
      {loading ? (
        <PageLoader />
      ) : tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No businesses found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tenants.map((t, index) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <Card className="rounded-xl border-border/60">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{t.name}</span>
                        <Badge variant={statusBadge(t.status)}>{t.status}</Badge>
                        <Badge variant="outline">{t.plan}</Badge>
                        {t.isPublished && <Badge variant="secondary">Published</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                        <span>/{t.slug}</span>
                        <span>· {t.category}</span>
                        {t.address?.city && <span>· {t.address.city}</span>}
                        {t.ownerId && typeof t.ownerId === "object" && (
                          <span>· Owner: {t.ownerId.name}</span>
                        )}
                        {t.bookingsCount !== undefined && <span>· {t.bookingsCount} bookings</span>}
                        {t.servicesCount !== undefined && <span>· {t.servicesCount} services</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => viewTenant(t._id)} title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => window.open(`/marketplace/${t.slug}`, "_blank")}
                      title="View storefront"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={t.status === "active" ? "destructive" : "default"}
                      size="sm"
                      className="rounded-xl"
                      onClick={() => toggleStatus(t._id, t.status)}
                    >
                      {t.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive rounded-xl"
                      onClick={() => deleteTenant(t._id)}
                      disabled={deleting === t._id}
                      title="Delete business"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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

      {/* Tenant Detail / Edit Modal */}
      <AnimatePresence>
      {selected && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { setSelected(null); setEditing(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border-border/60">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-primary/20 rounded-t-xl" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{editing ? "Edit Business" : "Business Details"}</h2>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => { setSelected(null); setEditing(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label>Business Name</Label>
                    <Input className="rounded-xl" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <textarea
                      className="w-full border rounded-xl p-2 text-sm min-h-[80px]"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      <Input className="rounded-xl" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <select
                        className="w-full border rounded-xl p-2 text-sm"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending_setup">Pending Setup</option>
                      </select>
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <select
                        className="w-full border rounded-xl p-2 text-sm"
                        value={editForm.plan}
                        onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                      >
                        <option value="free">Free</option>
                        <option value="standard">Standard</option>
                        <option value="ai">AI</option>
                        <option value="full_service">Full-Service</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <input
                        type="checkbox"
                        checked={editForm.isPublished}
                        onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                      />
                      <Label>Published</Label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="rounded-xl" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    <Button className="rounded-xl" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: "Bookings", value: selected.bookingsCount || 0, icon: CalendarCheck },
                      { label: "Services", value: selected.servicesCount || 0, icon: Layers },
                      { label: "Reviews", value: selected.reviewsCount || 0, icon: Star },
                      { label: "Users", value: selected.usersCount || 0, icon: Users },
                      { label: "Revenue", value: `₹${(selected.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-3 bg-muted/50 rounded-xl">
                        <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Name</span><p className="font-medium">{selected.name}</p></div>
                    <div><span className="text-muted-foreground">Slug</span><p className="font-medium">/{selected.slug}</p></div>
                    <div><span className="text-muted-foreground">Category</span><p className="font-medium capitalize">{selected.category}</p></div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p><Badge variant={statusBadge(selected.status)}>{selected.status}</Badge></p>
                    </div>
                    <div><span className="text-muted-foreground">Plan</span><p><Badge variant="outline">{selected.plan}</Badge></p></div>
                    <div><span className="text-muted-foreground">Published</span><p className="font-medium">{selected.isPublished ? "Yes" : "No"}</p></div>
                    <div><span className="text-muted-foreground">Rating</span><p className="font-medium">{selected.rating?.average?.toFixed(1) || "—"} ({selected.rating?.count || 0} reviews)</p></div>
                    <div><span className="text-muted-foreground">Created</span><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
                  </div>

                  {/* Owner info */}
                  {selected.ownerId && typeof selected.ownerId === "object" && (
                    <div className="p-3 bg-muted/50 rounded-xl text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Business Owner</p>
                      <p className="font-medium">{selected.ownerId.name}</p>
                      <p className="text-muted-foreground">{selected.ownerId.email} {selected.ownerId.phone && `· ${selected.ownerId.phone}`}</p>
                    </div>
                  )}

                  {/* Address */}
                  {selected.address?.city && (
                    <div className="p-3 bg-muted/50 rounded-xl text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Address</p>
                      <p className="font-medium">
                        {[selected.address?.street, selected.address?.city, selected.address?.state, selected.address?.zip, selected.address?.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Services */}
                  {selected.services && selected.services.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Services ({selected.services.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.services.map((s: any) => (
                          <Badge key={s._id} variant="secondary" className="text-xs">
                            {s.name} — ₹{s.price}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.description && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Description</span>
                      <p className="mt-1">{selected.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button className="rounded-xl" onClick={() => startEdit(selected)} size="sm">
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button className="rounded-xl" variant="outline" size="sm" onClick={() => window.open(`/marketplace/${selected.slug}`, "_blank")}>
                      <ExternalLink className="h-3 w-3 mr-1" /> View Store
                    </Button>
                    <Button className="rounded-xl" variant="destructive" size="sm" onClick={() => deleteTenant(selected._id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
