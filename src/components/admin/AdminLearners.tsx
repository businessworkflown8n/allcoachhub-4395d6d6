import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Search, Download, Eye, BookOpen, DollarSign, Trash2, Tag, Mail, X, ArrowUpDown, Users, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Video } from "lucide-react";



const TAG_OPTIONS = ["High Intent", "High Spend", "Inactive 30 Days", "New Learner", "Repeat Buyer", "VIP"];

const AdminLearners = () => {
  const { user } = useAuth();
  const [learners, setLearners] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [webinarRegs, setWebinarRegs] = useState<any[]>([]);
  const [webinars, setWebinars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [webinarFilter, setWebinarFilter] = useState<string>("all");
  const [spendSort, setSpendSort] = useState<"none" | "asc" | "desc">("none");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchAll = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "learner");
    if (!roles || roles.length === 0) { setLoading(false); return; }
    const ids = roles.map((r) => r.user_id);
    const [profiles, enrollData, courseData, webinarRegData, webinarData] = await Promise.all([
      supabase.from("profiles").select("*").in("user_id", ids),
      supabase.from("enrollments").select("*").in("learner_id", ids),
      supabase.from("courses").select("id, title, category"),
      supabase.from("webinar_registrations").select("*").in("learner_id", ids),
      supabase.from("webinars").select("id, title, webinar_date, coach_id"),
    ]);
    setLearners(profiles.data || []);
    setEnrollments(enrollData.data || []);
    setCourses(courseData.data || []);
    setWebinarRegs(webinarRegData.data || []);
    setWebinars(webinarData.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getLearnerStats = (userId: string) => {
    const le = enrollments.filter((e) => e.learner_id === userId);
    const totalSpent = le.reduce((s, e) => s + Number(e.amount_paid || 0), 0);
    const completed = le.filter((e) => e.completed_at).length;
    const avgProgress = le.length > 0 ? Math.round(le.reduce((s, e) => s + Number(e.progress_percent || 0), 0) / le.length) : 0;
    const categories = [...new Set(le.map(e => courses.find(c => c.id === e.course_id)?.category).filter(Boolean))];
    const lastEnrollment = le.length > 0 ? le.sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())[0].enrolled_at : null;
    const webinarCount = webinarRegs.filter((w) => w.learner_id === userId).length;
    return { enrolled: le.length, totalSpent, completed, avgProgress, categories, lastEnrollment, webinarCount };
  };

  const deleteLearner = async (learner: any) => {
    if (!confirm(`Remove learner "${learner.full_name}"? This cannot be undone.`)) return;
    const { error: roleErr } = await supabase.from("user_roles").delete().eq("user_id", learner.user_id);
    const { error: profErr } = await supabase.from("profiles").delete().eq("user_id", learner.user_id);
    if (roleErr || profErr) { toast({ title: "Error", description: (roleErr || profErr)?.message, variant: "destructive" }); return; }
    toast({ title: "Learner removed" });
    fetchAll();
  };

  const changePaymentStatus = async (enrollment: any, newStatus: string) => {
    const oldStatus = enrollment.payment_status;
    if (oldStatus === newStatus) return;
    setUpdatingStatus(enrollment.id);
    const { error } = await supabase.from("enrollments").update({ payment_status: newStatus }).eq("id", enrollment.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setUpdatingStatus(null); return; }
    if (user) {
      await supabase.from("payment_status_audit").insert({
        enrollment_id: enrollment.id, old_status: oldStatus, new_status: newStatus, changed_by: user.id,
      });
    }
    setEnrollments(prev => prev.map(e => e.id === enrollment.id ? { ...e, payment_status: newStatus } : e));
    setUpdatingStatus(null);
    toast({ title: `Payment status changed to ${newStatus}` });
  };

  const exportEnrollmentsCSV = (learnerEnrollments: any[]) => {
    const headers = ["Course", "Category", "Coach", "Amount", "Payment Status", "Payment ID", "Enrollment Date", "Progress"];
    const rows = learnerEnrollments.map((e) => {
      const course = courses.find(c => c.id === e.course_id);
      return [course?.title || "", course?.category || "", e.coach_id, `$${Number(e.amount_paid || 0).toFixed(2)}`, e.payment_status, e.payment_id || "", new Date(e.enrolled_at).toLocaleDateString(), `${e.progress_percent || 0}%`];
    });
    const csv = [headers, ...rows].map((r) => r.map(v => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "learner_enrollments.csv";
    a.click();
  };

  const updateTags = async (learner: any, tags: string[]) => {
    const { error } = await supabase.from("profiles").update({ tags }).eq("user_id", learner.user_id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setLearners(prev => prev.map(l => l.user_id === learner.user_id ? { ...l, tags } : l));
    toast({ title: "Tags updated" });
  };

  const countries = useMemo(() => [...new Set(learners.map(l => l.country).filter(Boolean))].sort(), [learners]);
  const allCategories = useMemo(() => [...new Set(courses.map(c => c.category).filter(Boolean))].sort(), [courses]);
  const allWebinars = useMemo(() => webinars.map(w => ({ id: w.id, title: w.title })), [webinars]);

  const filtered = useMemo(() => {
    let result = learners.filter((l) => {
      const matchesSearch = !search || [l.full_name, l.email, l.country, l.industry, l.city, l.contact_number].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
      const matchesCountry = countryFilter === "all" || l.country === countryFilter;
      const matchesCategory = categoryFilter === "all" || getLearnerStats(l.user_id).categories.includes(categoryFilter);
      const matchesWebinar = webinarFilter === "all" || webinarRegs.some(wr => wr.learner_id === l.user_id && wr.webinar_id === webinarFilter);
      return matchesSearch && matchesCountry && matchesCategory && matchesWebinar;
    });
    if (spendSort !== "none") {
      result = [...result].sort((a, b) => {
        const sa = getLearnerStats(a.user_id).totalSpent;
        const sb = getLearnerStats(b.user_id).totalSpent;
        return spendSort === "asc" ? sa - sb : sb - sa;
      });
    }
    return result;
  }, [learners, search, countryFilter, categoryFilter, webinarFilter, spendSort, enrollments, courses, webinarRegs]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(l => l.user_id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleBulkEmail = () => {
    toast({ title: `Campaign triggered for ${selectedIds.size} learners`, description: "Audience segment created" });
    setSelectedIds(new Set());
  };

  const handleAudienceSync = (platform: string) => {
    const count = selectedIds.size > 0 ? selectedIds.size : filtered.length;
    toast({ title: `${platform} Audience Sync`, description: `${count} learners queued for ${platform} audience export` });
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "WhatsApp", "Country", "City", "Industry", "Job Title", "Education", "Experience Level", "Enrolled Courses", "Webinars Registered", "Categories", "Progress %", "Total Spent", "Payment Status", "Marketing Consent", "UTM Source", "UTM Medium", "UTM Campaign", "Tags", "Last Active", "Joined"];
    const rows = filtered.map((l) => {
      const s = getLearnerStats(l.user_id);
      const paymentStatuses = enrollments.filter(e => e.learner_id === l.user_id).map(e => e.payment_status);
      const overallPayment = paymentStatuses.length === 0 ? "N/A" : paymentStatuses.every(p => p === "paid") ? "Paid" : paymentStatuses.some(p => p === "paid") ? "Partial" : "Unpaid";
      return [l.full_name, l.email, l.contact_number, l.whatsapp_number, l.country, l.city, l.industry, l.job_title, l.education, l.experience_level, s.enrolled, s.webinarCount, s.categories.join(";"), `${s.avgProgress}%`, `$${s.totalSpent.toFixed(2)}`, overallPayment, l.marketing_consent ? "Yes" : "No", l.utm_source, l.utm_medium, l.utm_campaign, (l.tags || []).join(";"), l.last_active_at ? new Date(l.last_active_at).toLocaleDateString() : "", new Date(l.created_at).toLocaleDateString()];
    });
    const csv = [headers, ...rows].map((r) => r.map(v => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "learners_report.csv";
    a.click();
  };

  const clearFilters = () => { setSearch(""); setCountryFilter("all"); setCategoryFilter("all"); setWebinarFilter("all"); setSpendSort("none"); };
  const hasFilters = search || countryFilter !== "all" || categoryFilter !== "all" || webinarFilter !== "all" || spendSort !== "none";

  const totalSpend = learners.reduce((s, l) => s + getLearnerStats(l.user_id).totalSpent, 0);
  const totalEnrolled = enrollments.length;
  const paidEnrollments = enrollments.filter(e => e.payment_status === "paid").length;
  const unpaidEnrollments = enrollments.filter(e => e.payment_status !== "paid").length;
  const activeLearners = learners.filter(l => {
    const lastActive = l.last_active_at ? new Date(l.last_active_at) : null;
    if (!lastActive) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastActive >= thirtyDaysAgo;
  }).length;
  const completedEnrollments = enrollments.filter(e => e.completed_at).length;
  const avgSpend = learners.length > 0 ? totalSpend / learners.length : 0;

  const enrollmentTrend = useMemo(() => {
    const monthMap: Record<string, { enrollments: number; revenue: number }> = {};
    enrollments.forEach(e => {
      const d = new Date(e.enrolled_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { enrollments: 0, revenue: 0 };
      monthMap[key].enrollments += 1;
      monthMap[key].revenue += Number(e.amount_paid || 0);
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        ...data,
      }));
  }, [enrollments]);

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  // ─── Detail view ───
  if (selectedLearner) {
    const s = getLearnerStats(selectedLearner.user_id);
    const learnerEnrollments = enrollments.filter((e) => e.learner_id === selectedLearner.user_id);
    const learnerTags: string[] = selectedLearner.tags || [];

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedLearner(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Learners</button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xl font-bold">{selectedLearner.full_name?.[0] || "L"}</div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedLearner.full_name || "—"}</h2>
              <p className="text-sm text-muted-foreground">{selectedLearner.industry} • {selectedLearner.country}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {learnerTags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
              </div>
            </div>
          </div>
          <button onClick={() => deleteLearner(selectedLearner)} className="flex items-center gap-1.5 rounded-lg bg-destructive/20 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/30">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-4"><BookOpen className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{s.enrolled}</p><p className="text-xs text-muted-foreground">Courses Enrolled</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><Video className="h-5 w-5 text-cyan-400 mb-2" /><p className="text-2xl font-bold text-foreground">{s.webinarCount}</p><p className="text-xs text-muted-foreground">Webinars Registered</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><GraduationCap className="h-5 w-5 text-green-400 mb-2" /><p className="text-2xl font-bold text-foreground">{s.completed}</p><p className="text-xs text-muted-foreground">Completed</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><DollarSign className="h-5 w-5 text-blue-400 mb-2" /><p className="text-2xl font-bold text-foreground">${s.totalSpent.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Spent</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><Tag className="h-5 w-5 text-purple-400 mb-2" /><p className="text-2xl font-bold text-foreground">{s.categories.length}</p><p className="text-xs text-muted-foreground">Category Interests</p></div>
        </div>

        {/* Contact & Profile */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Contact & Profile</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[["Email", selectedLearner.email], ["Phone", selectedLearner.contact_number], ["WhatsApp", selectedLearner.whatsapp_number], ["LinkedIn", selectedLearner.linkedin_profile], ["City", selectedLearner.city], ["Country", selectedLearner.country], ["Industry", selectedLearner.industry], ["Job Title", selectedLearner.job_title], ["Experience", selectedLearner.experience_level], ["Education", selectedLearner.education]].map(([label, val]) => (
                <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm text-foreground">{val || "—"}</p></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Marketing & Tracking</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[["Marketing Consent", selectedLearner.marketing_consent ? "Yes" : "No"], ["Last Active", selectedLearner.last_active_at ? new Date(selectedLearner.last_active_at).toLocaleDateString() : "—"], ["Registered", new Date(selectedLearner.created_at).toLocaleDateString()], ["UTM Source", selectedLearner.utm_source], ["UTM Medium", selectedLearner.utm_medium], ["UTM Campaign", selectedLearner.utm_campaign]].map(([label, val]) => (
                <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm text-foreground">{val || "—"}</p></div>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(tag => {
              const active = learnerTags.includes(tag);
              return (
                <button key={tag} onClick={() => updateTags(selectedLearner, active ? learnerTags.filter(t => t !== tag) : [...learnerTags, tag])}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${active ? "bg-primary/20 text-primary border-primary/40" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Webinar Registrations */}
        {(() => {
          const learnerWebinarRegs = webinarRegs.filter(wr => wr.learner_id === selectedLearner.user_id);
          return learnerWebinarRegs.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Webinar Registrations ({learnerWebinarRegs.length})</h3>
              <div className="rounded-xl border border-border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Webinar</TableHead><TableHead>Date</TableHead><TableHead>Registered On</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {learnerWebinarRegs.map((wr) => {
                      const webinar = webinars.find(w => w.id === wr.webinar_id);
                      return (
                        <TableRow key={wr.id}>
                          <TableCell className="text-foreground font-medium">{webinar?.title || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{webinar?.webinar_date ? new Date(webinar.webinar_date).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(wr.registered_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null;
        })()}

        {/* Enrollments */}
        {learnerEnrollments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Course Enrollments ({learnerEnrollments.length})</h3>
              <Button size="sm" variant="outline" onClick={() => exportEnrollmentsCSV(learnerEnrollments)} className="gap-1 h-8 text-xs">
                <Download className="h-3 w-3" /> Export
              </Button>
            </div>
            <div className="rounded-xl border border-border overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Progress</TableHead><TableHead>Paid Status</TableHead><TableHead>Payment ID</TableHead><TableHead>Enrolled</TableHead></TableRow></TableHeader>
                <TableBody>
                  {learnerEnrollments.map((e) => {
                    const course = courses.find((c) => c.id === e.course_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-foreground font-medium">{course?.title || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{course?.category || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">${Number(e.amount_paid || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${e.progress_percent || 0}%` }} /></div>
                            <span className="text-xs text-muted-foreground">{e.progress_percent || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={e.payment_status} onValueChange={(val) => changePaymentStatus(e, val)} disabled={updatingStatus === e.id}>
                            <SelectTrigger className={`w-24 h-7 text-xs border-0 ${e.payment_status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="pending">Unpaid</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{e.payment_id || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
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
        <div className="rounded-xl border border-border bg-card p-4"><GraduationCap className="h-5 w-5 text-blue-400 mb-2" /><p className="text-2xl font-bold text-foreground">{learners.length}</p><p className="text-xs text-muted-foreground">Total Learners</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><Users className="h-5 w-5 text-cyan-400 mb-2" /><p className="text-2xl font-bold text-foreground">{activeLearners}</p><p className="text-xs text-muted-foreground">Active (30 days)</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><BookOpen className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{totalEnrolled}</p><p className="text-xs text-muted-foreground">Total Enrollments</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><Video className="h-5 w-5 text-cyan-400 mb-2" /><p className="text-2xl font-bold text-foreground">{webinarRegs.length}</p><p className="text-xs text-muted-foreground">Webinar Registrations</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><GraduationCap className="h-5 w-5 text-emerald-400 mb-2" /><p className="text-2xl font-bold text-foreground">{completedEnrollments}</p><p className="text-xs text-muted-foreground">Completed Courses</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><DollarSign className="h-5 w-5 text-green-400 mb-2" /><p className="text-2xl font-bold text-foreground">${totalSpend.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><DollarSign className="h-5 w-5 text-teal-400 mb-2" /><p className="text-2xl font-bold text-foreground">${avgSpend.toFixed(2)}</p><p className="text-xs text-muted-foreground">Avg Spend / Learner</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><Tag className="h-5 w-5 text-green-500 mb-2" /><p className="text-2xl font-bold text-foreground">{paidEnrollments}</p><p className="text-xs text-muted-foreground">Paid Enrollments</p></div>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><Tag className="h-5 w-5 text-yellow-400 mb-2" /><p className="text-2xl font-bold text-foreground">{unpaidEnrollments}</p><p className="text-xs text-muted-foreground">Unpaid Enrollments</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><Users className="h-5 w-5 text-purple-400 mb-2" /><p className="text-2xl font-bold text-foreground">{learners.filter(l => l.marketing_consent).length}</p><p className="text-xs text-muted-foreground">Marketing Opted In</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><Filter className="h-5 w-5 text-orange-400 mb-2" /><p className="text-2xl font-bold text-foreground">{[...new Set(learners.map(l => l.country).filter(Boolean))].length}</p><p className="text-xs text-muted-foreground">Countries</p></div>
      </div>

      {/* Enrollment Trend Chart */}
      {enrollmentTrend.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Enrollment Trends (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={enrollmentTrend}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Area yAxisId="left" type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" fill="url(#enrollGrad)" strokeWidth={2} name="Enrollments" />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#revenueGrad)" strokeWidth={2} name="Revenue ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-foreground">Learner Management</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <Button size="sm" variant="secondary" onClick={handleBulkEmail} className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Campaign ({selectedIds.size})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handleAudienceSync("Meta Ads")} className="gap-1.5 text-xs">Meta Sync</Button>
            <Button size="sm" variant="outline" onClick={() => handleAudienceSync("Google Ads")} className="gap-1.5 text-xs">Google Sync</Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, phone, industry..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border w-60" />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-36 bg-secondary border-border"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Countries</SelectItem>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Categories</SelectItem>{allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" variant={spendSort !== "none" ? "default" : "outline"} onClick={() => setSpendSort(prev => prev === "none" ? "desc" : prev === "desc" ? "asc" : "none")} className="gap-1">
            <ArrowUpDown className="h-3.5 w-3.5" /> Spend {spendSort === "desc" ? "↓" : spendSort === "asc" ? "↑" : ""}
          </Button>
          {hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters} className="gap-1 text-muted-foreground"><X className="h-3.5 w-3.5" /> Clear</Button>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No learners found</p></div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const s = getLearnerStats(l.user_id);
                const tags: string[] = l.tags || [];
                return (
                  <TableRow key={l.id} className={selectedIds.has(l.user_id) ? "bg-primary/5" : ""}>
                    <TableCell><Checkbox checked={selectedIds.has(l.user_id)} onCheckedChange={() => toggleSelect(l.user_id)} /></TableCell>
                    <TableCell className="text-foreground font-medium">{l.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{l.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.contact_number || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.country || "—"}</TableCell>
                    <TableCell className="text-foreground">{s.enrolled}</TableCell>
                    <TableCell className="text-green-400 font-medium">${s.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${s.avgProgress}%` }} /></div>
                        <span className="text-xs text-muted-foreground">{s.avgProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-[140px]">
                        {tags.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                        {tags.length > 2 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{tags.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.last_active_at ? new Date(l.last_active_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedLearner(l)} className="text-primary hover:text-primary/80" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => deleteLearner(l)} className="text-destructive hover:text-destructive/80" title="Remove"><Trash2 className="h-4 w-4" /></button>
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

export default AdminLearners;
