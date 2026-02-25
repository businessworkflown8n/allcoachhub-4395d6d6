import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, Download, Eye, BookOpen, DollarSign, Users, Ban, CheckCircle, Trash2, Tag, Mail, Filter, X, ChevronDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const TAG_OPTIONS = ["High Revenue", "Top Coach", "New Coach", "Inactive", "Featured", "VIP"];

const AdminCoaches = () => {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [revenueSort, setRevenueSort] = useState<"none" | "asc" | "desc">("none");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagPopoverOpen, setTagPopoverOpen] = useState<string | null>(null);

  const fetchAll = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "coach");
    if (!roles || roles.length === 0) { setLoading(false); return; }
    const ids = roles.map((r) => r.user_id);
    const [profiles, courseData, enrollData, payData] = await Promise.all([
      supabase.from("profiles").select("*").in("user_id", ids),
      supabase.from("courses").select("*").in("coach_id", ids),
      supabase.from("enrollments").select("*").in("coach_id", ids),
      supabase.from("payments").select("*").in("coach_id", ids),
    ]);
    setCoaches(profiles.data || []);
    setCourses(courseData.data || []);
    setEnrollments(enrollData.data || []);
    setPayments(payData.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getCoachStats = (userId: string) => {
    const coachCourses = courses.filter((c) => c.coach_id === userId);
    const coachEnrollments = enrollments.filter((e) => e.coach_id === userId);
    const coachPayments = payments.filter((p) => p.coach_id === userId && p.status === "paid");
    const revenue = coachPayments.reduce((s, p) => s + Number(p.amount), 0);
    const categories = [...new Set(coachCourses.map(c => c.category))];
    return { courses: coachCourses.length, enrollments: coachEnrollments.length, revenue, categories };
  };

  const toggleSuspend = async (coach: any) => {
    const newStatus = !coach.is_suspended;
    const { error } = await supabase.from("profiles").update({ is_suspended: newStatus }).eq("user_id", coach.user_id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: newStatus ? "Coach suspended" : "Coach activated" });
    fetchAll();
  };

  const deleteCoach = async (coach: any) => {
    if (!confirm(`Delete coach "${coach.full_name}"? This cannot be undone.`)) return;
    const { error: roleErr } = await supabase.from("user_roles").delete().eq("user_id", coach.user_id);
    const { error: profErr } = await supabase.from("profiles").delete().eq("user_id", coach.user_id);
    if (roleErr || profErr) { toast({ title: "Error", description: (roleErr || profErr)?.message, variant: "destructive" }); return; }
    toast({ title: "Coach deleted" });
    fetchAll();
  };

  const updateTags = async (coach: any, tags: string[]) => {
    const { error } = await supabase.from("profiles").update({ tags }).eq("user_id", coach.user_id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setCoaches(prev => prev.map(c => c.user_id === coach.user_id ? { ...c, tags } : c));
    toast({ title: "Tags updated" });
  };

  const countries = useMemo(() => [...new Set(coaches.map(c => c.country).filter(Boolean))].sort(), [coaches]);
  const cities = useMemo(() => [...new Set(coaches.map(c => c.city).filter(Boolean))].sort(), [coaches]);

  const filtered = useMemo(() => {
    let result = coaches.filter((c) => {
      const matchesSearch = !search || [c.full_name, c.category, c.country, c.city, c.company_name, c.contact_number].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? !c.is_suspended : c.is_suspended);
      const matchesCountry = countryFilter === "all" || c.country === countryFilter;
      const matchesCity = cityFilter === "all" || c.city === cityFilter;
      return matchesSearch && matchesStatus && matchesCountry && matchesCity;
    });
    if (revenueSort !== "none") {
      result = [...result].sort((a, b) => {
        const ra = getCoachStats(a.user_id).revenue;
        const rb = getCoachStats(b.user_id).revenue;
        return revenueSort === "asc" ? ra - rb : rb - ra;
      });
    }
    return result;
  }, [coaches, search, statusFilter, countryFilter, cityFilter, revenueSort, courses, enrollments, payments]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(c => c.user_id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleBulkEmail = () => {
    const selected = coaches.filter(c => selectedIds.has(c.user_id));
    const emails = selected.map(c => c.contact_number).filter(Boolean);
    toast({ title: `Campaign triggered for ${selectedIds.size} coaches`, description: `Emails: ${emails.length} contacts selected` });
    setSelectedIds(new Set());
  };

  const exportCSV = () => {
    const headers = ["Name", "Company", "Email", "Phone", "Status", "Category", "Country", "City", "Courses", "Enrollments", "Revenue", "Marketing Consent", "UTM Source", "UTM Medium", "UTM Campaign", "Tags", "Joined"];
    const rows = filtered.map((c) => {
      const s = getCoachStats(c.user_id);
      return [c.full_name, c.company_name, c.contact_number, c.whatsapp_number, c.is_suspended ? "Suspended" : "Active", c.category, c.country, c.city, s.courses, s.enrollments, `$${s.revenue.toFixed(2)}`, c.marketing_consent ? "Yes" : "No", c.utm_source, c.utm_medium, c.utm_campaign, (c.tags || []).join(";"), new Date(c.created_at).toLocaleDateString()];
    });
    const csv = [headers, ...rows].map((r) => r.map(v => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "coaches_report.csv";
    a.click();
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setCountryFilter("all"); setCityFilter("all"); setRevenueSort("none");
  };
  const hasFilters = search || statusFilter !== "all" || countryFilter !== "all" || cityFilter !== "all" || revenueSort !== "none";

  // Summary stats
  const totalRevenue = coaches.reduce((s, c) => s + getCoachStats(c.user_id).revenue, 0);
  const totalEnrollments = coaches.reduce((s, c) => s + getCoachStats(c.user_id).enrollments, 0);

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  // ─── Detail view ───
  if (selectedCoach) {
    const s = getCoachStats(selectedCoach.user_id);
    const coachCourses = courses.filter((c) => c.coach_id === selectedCoach.user_id);
    const coachEnrollments = enrollments.filter((e) => e.coach_id === selectedCoach.user_id);
    const coachTags: string[] = selectedCoach.tags || [];

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCoach(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Coaches</button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary text-xl font-bold">{selectedCoach.full_name?.[0] || "C"}</div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedCoach.full_name || "—"}</h2>
              <p className="text-sm text-muted-foreground">{selectedCoach.company_name && `${selectedCoach.company_name} • `}{selectedCoach.category} • {selectedCoach.country}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {coachTags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleSuspend(selectedCoach)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${selectedCoach.is_suspended ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"}`}>
              {selectedCoach.is_suspended ? <><CheckCircle className="h-3.5 w-3.5" /> Activate</> : <><Ban className="h-3.5 w-3.5" /> Suspend</>}
            </button>
            <button onClick={() => deleteCoach(selectedCoach)} className="flex items-center gap-1.5 rounded-lg bg-destructive/20 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/30">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {selectedCoach.is_suspended && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3"><p className="text-sm text-destructive font-medium">This coach is currently suspended</p></div>
        )}

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4"><BookOpen className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{s.courses}</p><p className="text-xs text-muted-foreground">Total Courses</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><Users className="h-5 w-5 text-blue-400 mb-2" /><p className="text-2xl font-bold text-foreground">{s.enrollments}</p><p className="text-xs text-muted-foreground">Total Enrollments</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><DollarSign className="h-5 w-5 text-green-400 mb-2" /><p className="text-2xl font-bold text-foreground">${s.revenue.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><Tag className="h-5 w-5 text-purple-400 mb-2" /><p className="text-2xl font-bold text-foreground">{s.categories.length}</p><p className="text-xs text-muted-foreground">Categories</p></div>
        </div>

        {/* Contact & Profile */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Contact Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[["Company", selectedCoach.company_name], ["Phone", selectedCoach.contact_number], ["WhatsApp", selectedCoach.whatsapp_number], ["LinkedIn", selectedCoach.linkedin_profile], ["City", selectedCoach.city], ["Country", selectedCoach.country]].map(([label, val]) => (
                <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm text-foreground break-all">{val || "—"}</p></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Profile & Marketing</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[["Bio", selectedCoach.bio], ["Education", selectedCoach.education], ["Experience", selectedCoach.experience], ["Category", selectedCoach.category], ["Marketing Consent", selectedCoach.marketing_consent ? "Yes" : "No"], ["Registered", new Date(selectedCoach.created_at).toLocaleDateString()]].map(([label, val]) => (
                <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm text-foreground">{val || "—"}</p></div>
              ))}
            </div>
          </div>
        </div>

        {/* UTM Info */}
        {(selectedCoach.utm_source || selectedCoach.utm_medium || selectedCoach.utm_campaign) && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Signup Source (UTM)</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[["Source", selectedCoach.utm_source], ["Medium", selectedCoach.utm_medium], ["Campaign", selectedCoach.utm_campaign]].map(([label, val]) => (
                <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm text-foreground">{val || "—"}</p></div>
              ))}
            </div>
          </div>
        )}

        {/* Tags management */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(tag => {
              const active = coachTags.includes(tag);
              return (
                <button key={tag} onClick={() => updateTags(selectedCoach, active ? coachTags.filter(t => t !== tag) : [...coachTags, tag])}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${active ? "bg-primary/20 text-primary border-primary/40" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Courses */}
        {coachCourses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Courses ({coachCourses.length})</h3>
            <div className="rounded-xl border border-border overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Level</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {coachCourses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-foreground font-medium">{c.title}</TableCell>
                      <TableCell className="text-muted-foreground">{c.category}</TableCell>
                      <TableCell className="text-muted-foreground">{c.level}</TableCell>
                      <TableCell className="text-foreground">${c.price_usd}</TableCell>
                      <TableCell><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.approval_status === "approved" ? "bg-green-500/20 text-green-400" : c.approval_status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{c.approval_status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Enrollments */}
        {coachEnrollments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Learners Enrolled ({coachEnrollments.length})</h3>
            <div className="rounded-xl border border-border overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Learner</TableHead><TableHead>Email</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {coachEnrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-foreground font-medium">{e.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{e.email}</TableCell>
                      <TableCell className="text-muted-foreground">{e.contact_number}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs ${e.payment_status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{e.payment_status}</span></TableCell>
                      <TableCell className="text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List view ───
  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4"><Shield className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{coaches.length}</p><p className="text-xs text-muted-foreground">Total Coaches</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><BookOpen className="h-5 w-5 text-blue-400 mb-2" /><p className="text-2xl font-bold text-foreground">{courses.length}</p><p className="text-xs text-muted-foreground">Total Courses</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><Users className="h-5 w-5 text-purple-400 mb-2" /><p className="text-2xl font-bold text-foreground">{totalEnrollments}</p><p className="text-xs text-muted-foreground">Total Enrollments</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><DollarSign className="h-5 w-5 text-green-400 mb-2" /><p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div>
      </div>

      {/* Header + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-foreground">Coach Management</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <Button size="sm" variant="secondary" onClick={handleBulkEmail} className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Campaign ({selectedIds.size})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, company, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border w-60" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-36 bg-secondary border-border"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Countries</SelectItem>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-32 bg-secondary border-border"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Cities</SelectItem>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" variant={revenueSort !== "none" ? "default" : "outline"} onClick={() => setRevenueSort(prev => prev === "none" ? "desc" : prev === "desc" ? "asc" : "none")} className="gap-1">
            <ArrowUpDown className="h-3.5 w-3.5" /> Revenue {revenueSort === "desc" ? "↓" : revenueSort === "asc" ? "↑" : ""}
          </Button>
          {hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters} className="gap-1 text-muted-foreground"><X className="h-3.5 w-3.5" /> Clear</Button>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No coaches found</p></div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const s = getCoachStats(c.user_id);
                const tags: string[] = c.tags || [];
                return (
                  <TableRow key={c.id} className={selectedIds.has(c.user_id) ? "bg-primary/5" : ""}>
                    <TableCell><Checkbox checked={selectedIds.has(c.user_id)} onCheckedChange={() => toggleSelect(c.user_id)} /></TableCell>
                    <TableCell className="text-foreground font-medium">{c.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.company_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.contact_number || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.country || "—"}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.is_suspended ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                        {c.is_suspended ? "Suspended" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">{s.courses}</TableCell>
                    <TableCell className="text-foreground">{s.enrollments}</TableCell>
                    <TableCell className="text-green-400 font-medium">${s.revenue.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-[140px]">
                        {tags.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                        {tags.length > 2 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{tags.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedCoach(c)} className="text-primary hover:text-primary/80" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => toggleSuspend(c)} className={c.is_suspended ? "text-green-400 hover:text-green-300" : "text-yellow-400 hover:text-yellow-300"} title={c.is_suspended ? "Activate" : "Suspend"}>
                          {c.is_suspended ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>
                        <button onClick={() => deleteCoach(c)} className="text-destructive hover:text-destructive/80" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminCoaches;
