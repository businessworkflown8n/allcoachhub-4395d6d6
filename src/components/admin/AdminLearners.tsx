import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Search, Download, Eye, BookOpen, DollarSign, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const AdminLearners = () => {
  const [learners, setLearners] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLearner, setSelectedLearner] = useState<any>(null);

  const fetchAll = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "learner");
    if (!roles || roles.length === 0) { setLoading(false); return; }
    const ids = roles.map((r) => r.user_id);
    const [profiles, enrollData, courseData] = await Promise.all([
      supabase.from("profiles").select("*").in("user_id", ids),
      supabase.from("enrollments").select("*").in("learner_id", ids),
      supabase.from("courses").select("id, title, category"),
    ]);
    setLearners(profiles.data || []);
    setEnrollments(enrollData.data || []);
    setCourses(courseData.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getLearnerStats = (userId: string) => {
    const learnerEnrollments = enrollments.filter((e) => e.learner_id === userId);
    const totalSpent = learnerEnrollments.reduce((s, e) => s + Number(e.amount_paid || 0), 0);
    const completed = learnerEnrollments.filter((e) => e.completed_at).length;
    const avgProgress = learnerEnrollments.length > 0
      ? Math.round(learnerEnrollments.reduce((s, e) => s + Number(e.progress_percent || 0), 0) / learnerEnrollments.length)
      : 0;
    return { enrolled: learnerEnrollments.length, totalSpent, completed, avgProgress };
  };

  const deleteLearner = async (learner: any) => {
    if (!confirm(`Remove learner "${learner.full_name}"? This cannot be undone.`)) return;
    const { error: roleErr } = await supabase.from("user_roles").delete().eq("user_id", learner.user_id);
    const { error: profErr } = await supabase.from("profiles").delete().eq("user_id", learner.user_id);
    if (roleErr || profErr) { toast({ title: "Error", description: (roleErr || profErr)?.message, variant: "destructive" }); return; }
    toast({ title: "Learner removed" });
    fetchAll();
  };

  const filtered = learners.filter((l) =>
    !search || [l.full_name, l.country, l.industry, l.city].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const exportCSV = () => {
    const headers = ["Name", "Country", "City", "Industry", "Job Title", "Contact", "Enrolled Courses", "Progress %", "Total Spent", "Joined"];
    const rows = filtered.map((l) => {
      const s = getLearnerStats(l.user_id);
      return [l.full_name, l.country, l.city, l.industry, l.job_title, l.contact_number, s.enrolled, `${s.avgProgress}%`, `$${s.totalSpent.toFixed(2)}`, new Date(l.created_at).toLocaleDateString()];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "learners_report.csv";
    a.click();
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  if (selectedLearner) {
    const s = getLearnerStats(selectedLearner.user_id);
    const learnerEnrollments = enrollments.filter((e) => e.learner_id === selectedLearner.user_id);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedLearner(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">← Back to Learners</button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xl font-bold">{selectedLearner.full_name?.[0] || "L"}</div>
            <div><h2 className="text-xl font-bold text-foreground">{selectedLearner.full_name || "—"}</h2><p className="text-sm text-muted-foreground">{selectedLearner.industry} • {selectedLearner.country}</p></div>
          </div>
          <button onClick={() => deleteLearner(selectedLearner)} className="flex items-center gap-1.5 rounded-lg bg-destructive/20 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/30">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Contact & Profile</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[["Phone", selectedLearner.contact_number], ["WhatsApp", selectedLearner.whatsapp_number], ["LinkedIn", selectedLearner.linkedin_profile], ["City", selectedLearner.city], ["Country", selectedLearner.country], ["Industry", selectedLearner.industry], ["Job Title", selectedLearner.job_title], ["Experience", selectedLearner.experience_level], ["Education", selectedLearner.education]].map(([label, val]) => (
              <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm text-foreground">{val || "—"}</p></div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4"><BookOpen className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{s.enrolled}</p><p className="text-xs text-muted-foreground">Courses Enrolled</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><GraduationCap className="h-5 w-5 text-green-400 mb-2" /><p className="text-2xl font-bold text-foreground">{s.completed}</p><p className="text-xs text-muted-foreground">Completed</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><DollarSign className="h-5 w-5 text-blue-400 mb-2" /><p className="text-2xl font-bold text-foreground">${s.totalSpent.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Spent</p></div>
        </div>

        {learnerEnrollments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Course Enrollments</h3>
            <div className="rounded-xl border border-border overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Amount</TableHead><TableHead>Progress</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {learnerEnrollments.map((e) => {
                    const course = courses.find((c) => c.id === e.course_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-foreground font-medium">{course?.title || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">${Number(e.amount_paid || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${e.progress_percent || 0}%` }} /></div>
                            <span className="text-xs text-muted-foreground">{e.progress_percent || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell><span className={`rounded-full px-2 py-0.5 text-xs ${e.payment_status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{e.payment_status}</span></TableCell>
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">Learner Management</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search learners..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border w-56" />
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No learners found</p></div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Enrolled Courses</TableHead>
                <TableHead>Progress %</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const s = getLearnerStats(l.user_id);
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-foreground font-medium">{l.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.contact_number || "—"}</TableCell>
                    <TableCell className="text-foreground">{s.enrolled}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${s.avgProgress}%` }} /></div>
                        <span className="text-xs text-muted-foreground">{s.avgProgress}%</span>
                      </div>
                    </TableCell>
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
