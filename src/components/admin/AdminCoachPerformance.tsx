import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Download, Search, TrendingUp } from "lucide-react";

const AdminCoachPerformance = () => {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [webinars, setWebinars] = useState<any[]>([]);
  const [webinarRegs, setWebinarRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "coach");
      if (!roles?.length) { setLoading(false); return; }
      const ids = roles.map(r => r.user_id);
      const [p, c, e, w, wr] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, category, country").in("user_id", ids),
        supabase.from("courses").select("id, coach_id, price_usd").in("coach_id", ids),
        supabase.from("enrollments").select("coach_id, payment_status, amount_paid").in("coach_id", ids),
        supabase.from("webinars").select("id, coach_id").in("coach_id", ids),
        supabase.from("webinar_registrations").select("webinar_id"),
      ]);
      setCoaches(p.data || []);
      setCourses(c.data || []);
      setEnrollments(e.data || []);
      setWebinars(w.data || []);
      setWebinarRegs(wr.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const getStats = (userId: string) => {
    const cc = courses.filter(c => c.coach_id === userId);
    const ce = enrollments.filter(e => e.coach_id === userId);
    const cw = webinars.filter(w => w.coach_id === userId);
    const cwIds = cw.map(w => w.id);
    const cwRegs = webinarRegs.filter(r => cwIds.includes(r.webinar_id));
    const paid = ce.filter(e => e.payment_status === "paid");
    const revenue = paid.reduce((s, e) => s + Number(e.amount_paid || 0), 0);
    return { courses: cc.length, enrollments: ce.length, paidEnrollments: paid.length, webinars: cw.length, webinarRegs: cwRegs.length, revenue };
  };

  const filtered = useMemo(() => {
    return coaches.filter(c => !search || [c.full_name, c.email, c.category].some(v => v?.toLowerCase().includes(search.toLowerCase())));
  }, [coaches, search]);

  const exportCSV = () => {
    const headers = ["Coach Name", "Email", "Category", "Country", "Courses", "Course Enrollments", "Paid Enrollments", "Webinars Created", "Webinar Registrations", "Total Revenue"];
    const rows = filtered.map(c => {
      const s = getStats(c.user_id);
      return [c.full_name, c.email, c.category, c.country, s.courses, s.enrollments, s.paidEnrollments, s.webinars, s.webinarRegs, `$${s.revenue.toFixed(2)}`];
    });
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "coach_performance_report.csv";
    a.click();
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">Coach Performance Report</h2>
        <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search coaches..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No coaches found</p></div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Course Enrollments</TableHead>
                <TableHead>Paid Enrollments</TableHead>
                <TableHead>Webinars</TableHead>
                <TableHead>Webinar Regs</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => {
                const s = getStats(c.user_id);
                return (
                  <TableRow key={c.user_id}>
                    <TableCell className="text-foreground font-medium">{c.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.country || "—"}</TableCell>
                    <TableCell className="text-foreground">{s.courses}</TableCell>
                    <TableCell className="text-foreground">{s.enrollments}</TableCell>
                    <TableCell className="text-green-400">{s.paidEnrollments}</TableCell>
                    <TableCell className="text-foreground">{s.webinars}</TableCell>
                    <TableCell className="text-foreground">{s.webinarRegs}</TableCell>
                    <TableCell className="text-foreground font-medium">${s.revenue.toFixed(2)}</TableCell>
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

export default AdminCoachPerformance;
