"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
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
  Eye,
  Pencil,
  Trash2,
  X,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
} from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  tenantId?: { _id: string; name: string; slug: string; status: string; plan: string } | null;
  createdAt: string;
  bookingsCount?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail/Edit modal
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await api.get<any>(`/admin/users?${params}`);
      setUsers(res?.data || []);
      setTotalPages(res?.pagination?.totalPages || 1);
      setTotal(res?.pagination?.total || 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const viewUser = async (id: string) => {
    try {
      const res = await api.get<any>(`/admin/users/${id}`);
      setSelected(res);
      setEditing(false);
    } catch {}
  };

  const startEdit = (user: AdminUser) => {
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${selected._id}`, editForm);
      setEditing(false);
      setSelected(null);
      fetchUsers();
    } catch {}
    setSaving(false);
  };

  const toggleActive = async (user: AdminUser) => {
    try {
      await api.put(`/admin/users/${user._id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch {}
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setSelected(null);
      fetchUsers();
    } catch {}
    setDeleting(null);
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "destructive" as const;
      case "client_admin": return "default" as const;
      default: return "secondary" as const;
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "client_admin": return "Business Owner";
      default: return "Customer";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description={`Manage all platform users (${total} total)`} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 rounded-xl h-10"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          {["", "customer", "client_admin", "super_admin"].map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? "default" : "ghost"}
              size="sm"
              className="rounded-lg"
              onClick={() => { setRoleFilter(r); setPage(1); }}
            >
              <Filter className="h-3 w-3 mr-1" />
              {r === "" ? "All" : roleLabel(r)}
            </Button>
          ))}
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <p className="text-base font-medium text-muted-foreground">No users found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="rounded-xl border-border/60">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{u.name}</span>
                        <Badge variant={roleColor(u.role)}>{roleLabel(u.role)}</Badge>
                        {!u.isActive && <Badge variant="destructive">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{u.email}</span>
                        {u.phone && <span>· {u.phone}</span>}
                        {u.tenantId && typeof u.tenantId === "object" && (
                          <span>· 🏢 {u.tenantId.name}</span>
                        )}
                        <span>· {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => viewUser(u._id)} title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => toggleActive(u)}
                      title={u.isActive ? "Deactivate" : "Activate"}
                    >
                      {u.isActive ? <UserX className="h-4 w-4 text-orange-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                    </Button>
                    {u.role !== "super_admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-destructive hover:text-destructive"
                        onClick={() => deleteUser(u._id)}
                        disabled={deleting === u._id}
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* User Detail / Edit Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setEditing(false); }}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border-border/60" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{editing ? "Edit User" : "User Details"}</h2>
                <Button variant="ghost" size="icon" onClick={() => { setSelected(null); setEditing(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input className="rounded-xl" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input className="rounded-xl" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input className="rounded-xl" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <select
                      className="w-full border rounded-xl p-2 text-sm"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="client_admin">Business Owner</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="rounded-xl" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    <Button className="rounded-xl" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Name</span><p className="font-medium">{selected.name}</p></div>
                    <div><span className="text-muted-foreground">Email</span><p className="font-medium">{selected.email}</p></div>
                    <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{selected.phone || "—"}</p></div>
                    <div><span className="text-muted-foreground">Role</span><p><Badge variant={roleColor(selected.role)}>{roleLabel(selected.role)}</Badge></p></div>
                    <div><span className="text-muted-foreground">Status</span><p><Badge variant={selected.isActive ? "default" : "destructive"}>{selected.isActive ? "Active" : "Inactive"}</Badge></p></div>
                    <div><span className="text-muted-foreground">Joined</span><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
                    {selected.bookingsCount !== undefined && (
                      <div><span className="text-muted-foreground">Bookings</span><p className="font-medium">{selected.bookingsCount}</p></div>
                    )}
                    {selected.tenantId && typeof selected.tenantId === "object" && (
                      <div><span className="text-muted-foreground">Business</span><p className="font-medium">{selected.tenantId.name} ({selected.tenantId.status})</p></div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="rounded-xl" onClick={() => startEdit(selected)} size="sm">
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    {selected.role !== "super_admin" && (
                      <Button className="rounded-xl" variant="destructive" size="sm" onClick={() => deleteUser(selected._id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
