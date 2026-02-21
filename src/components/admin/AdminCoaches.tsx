import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, Download, Eye, X, BookOpen, DollarSign, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

const AdminCoaches = () => {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<any>(null);

  useEffect(() => {
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
    fetchAll();
  }, []);

  const getCoachStats = (userId: string) => {
    const coachCourses = courses.filter((c) => c.coach_id === userId);
    const coachEnrollments = enrollments.filter((e) => e.coach_id === userId);
    const coachPayments = payments.filter((p) => p.coach_id === userId && p.status === "paid");
    const revenue = coachPayments.reduce((s, p) => s + Number(p.amount), 0);
    return { courses: coachCourses.length, enrollments: coachEnrollments.length, revenue };
  };

  const filtered = coaches.filter((c) =>
    !search || [c.full_name, c.category, c.country, c.city].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const exportCSV = () => {
    const headers = ["Name", "Category", "Country", "City", "Contact", "WhatsApp", "LinkedIn", "Courses", "Enrollments", "Revenue", "Joined"];
    const rows = filtered.map((c) => {
      const s = getCoachStats(c.user_id);
      return [c.full_name, c.category, c.country, c.city, c.contact_number, c.whatsapp_number, c.linkedin_profile, s.courses, s.enrollments, `$${s.revenue.toFixed(2)}`, new Date(c.created_at).toLocaleDateString()];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "coaches_report.csv";
    a.click();
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  // Detail view
  if (selectedCoach) {
    const s = getCoachStats(selectedCoach.user_id);
    const coachCourses = courses.filter((c) => c.coach_id === selectedCoach.user_id);
    const coachEnrollments = enrollments.filter((e) => e.coach_id === selectedCoach.user_id);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCoach(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Coaches
        </button>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary text-xl font-bold">
            {selectedCoach.full_name?.[0] || "C"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedCoach.full_name || "—"}</h2>
            <p className="text-sm text-muted-foreground">{selectedCoach.category} • {selectedCoach.country}</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Contact Information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Phone", selectedCoach.contact_number],
              ["WhatsApp", selectedCoach.whatsapp_number],
              ["LinkedIn", selectedCoach.linkedin_profile],
              ["City", selectedCoach.city],
              ["Country", selectedCoach.country],
              ["Bio", selectedCoach.bio],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm text-foreground">{val || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <BookOpen className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.courses}</p>
            <p className="text-xs text-muted-foreground">Courses</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Users className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.enrollments}</p>
            <p className="text-xs text-muted-foreground">Enrollments</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <DollarSign className="h-5 w-5 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-foreground">${s.revenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>

        {/* Courses list */}
        {coachCourses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Courses</h3>
            {coachCourses.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.category} • {c.level} • ${c.price_usd}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.is_published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {c.is_published ? "Published" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Enrollments list */}
        {coachEnrollments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Learners Enrolled</h3>
            <div className="rounded-xl border border-border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coachEnrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-foreground font-medium">{e.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{e.email}</TableCell>
                      <TableCell className="text-muted-foreground">{e.contact_number}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${e.payment_status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {e.payment_status}
                        </span>
                      </TableCell>
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">Coach Management</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search coaches..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border w-56" />
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No coaches found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const s = getCoachStats(c.user_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-foreground font-medium">{c.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.country || "—"}</TableCell>
                    <TableCell className="text-foreground">{s.courses}</TableCell>
                    <TableCell className="text-foreground">{s.enrollments}</TableCell>
                    <TableCell className="text-green-400 font-medium">${s.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <button onClick={() => setSelectedCoach(c)} className="text-primary hover:text-primary/80">
                        <Eye className="h-4 w-4" />
                      </button>
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
