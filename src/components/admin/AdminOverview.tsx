import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, GraduationCap, DollarSign, TrendingUp, BookOpen, Activity, CheckCircle, XCircle, ChevronDown, ChevronUp, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useCurrency } from "@/hooks/useCurrency";

const AdminOverview = () => {
  const { symbol, priceKey } = useCurrency();
  const [stats, setStats] = useState({ coaches: 0, learners: 0, revenue: 0, enrollments: 0, courses: 0, reviews: 0, pendingApprovals: 0, paidEnrollments: 0, unpaidEnrollments: 0, webinars: 0, webinarRegs: 0 });
  const [enrollmentsByMonth, setEnrollmentsByMonth] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [coursesByCategory, setCoursesByCategory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [coaches, learners, payments, enrollments, courses, reviews, profiles, webinarsRes, webinarRegsRes] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "coach"),
        supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "learner"),
        supabase.from("payments").select("*").eq("status", "paid"),
        supabase.from("enrollments").select("*, courses(title, price_usd, price_inr, coach_id)").order("enrolled_at", { ascending: false }),
        supabase.from("courses").select("*"),
        supabase.from("reviews").select("id", { count: "exact" }),
        supabase.from("profiles").select("user_id, full_name, contact_number"),
        supabase.from("webinars").select("id", { count: "exact" }),
        supabase.from("webinar_registrations").select("id", { count: "exact" }),
      ]);

      const payData = payments.data || [];
      const enrollData = enrollments.data || [];
      const courseData = courses.data || [];
      const profileData = profiles.data || [];
      const profileMap: Record<string, { name: string; phone: string }> = {};
      profileData.forEach((p: any) => { if (p.user_id) profileMap[p.user_id] = { name: p.full_name || "Unknown", phone: p.contact_number || "N/A" }; });

      const paidEnrollments = enrollData.filter((e: any) => e.payment_status === "paid").length;
      const unpaidEnrollments = enrollData.filter((e: any) => e.payment_status !== "paid").length;
      // Revenue only from paid enrollments
      const paidRevenue = enrollData.filter((e: any) => e.payment_status === "paid").reduce((s: number, e: any) => s + Number(e.amount_paid || 0), 0);

      setStats({
        coaches: coaches.count || 0,
        learners: learners.count || 0,
        revenue: paidRevenue,
        enrollments: enrollData.length,
        courses: courseData.length,
        reviews: reviews.count || 0,
        pendingApprovals: courseData.filter((c: any) => c.approval_status === "pending").length,
        paidEnrollments,
        unpaidEnrollments,
        webinars: webinarsRes.count || 0,
        webinarRegs: webinarRegsRes.count || 0,
      });

      // Enrollments by month
      const monthMap: Record<string, number> = {};
      enrollData.forEach((e) => {
        const m = new Date(e.enrolled_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
        monthMap[m] = (monthMap[m] || 0) + 1;
      });
      setEnrollmentsByMonth(Object.entries(monthMap).slice(-6).map(([month, count]) => ({ month, count })));

      // Revenue by month (only paid enrollments)
      const revMap: Record<string, number> = {};
      enrollData.filter((e: any) => e.payment_status === "paid").forEach((e: any) => {
        const m = new Date(e.enrolled_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
        revMap[m] = (revMap[m] || 0) + Number(e.amount_paid || 0);
      });
      setRevenueByMonth(Object.entries(revMap).slice(-6).map(([month, revenue]) => ({ month, revenue })));

      // Courses by category
      const catMap: Record<string, number> = {};
      courseData.forEach((c) => { catMap[c.category] = (catMap[c.category] || 0) + 1; });
      setCoursesByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // Recent activity feed
      const activities: any[] = [];
      enrollData.slice(0, 10).forEach((e: any) => {
        const course = e.courses;
        const coachProfile = course?.coach_id ? profileMap[course.coach_id] : null;
        const coachName = coachProfile?.name || "Unknown Coach";
        const coachPhone = coachProfile?.phone || "N/A";
        activities.push({
          type: "enrollment",
          name: e.full_name,
          detail: `enrolled in a course`,
          courseName: course?.title || "Unknown Course",
          coachName,
          coachPhone,
          fee: course ? `${symbol}${Number(course[priceKey] || course.price_usd)}` : "N/A",
          paymentStatus: e.payment_status,
          time: e.enrolled_at,
        });
      });
      payData.slice(0, 5).forEach((p) => {
        activities.push({ type: "payment", name: `$${Number(p.amount).toFixed(2)}`, detail: `payment received`, time: p.created_at });
      });
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 8));

      setLoading(false);
    };
    fetchAll();
  }, []);

  const exportActivityCSV = () => {
    const enrollmentActivities = recentActivity.filter(a => a.type === "enrollment");
    if (!enrollmentActivities.length) return;
    const headers = ["Learner Name", "Course", "Coach", "Coach Phone", "Fee", "Payment Status", "Date"];
    const rows = enrollmentActivities.map(a => [
      a.name, a.courseName, a.coachName, a.coachPhone, a.fee, a.paymentStatus, new Date(a.time).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "recent_activity.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

  const statCards = [
    { label: "Total Coaches", value: stats.coaches, icon: Users, color: "text-primary" },
    { label: "Total Learners", value: stats.learners, icon: GraduationCap, color: "text-blue-400" },
    { label: "Total Revenue (Paid)", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
    { label: "Total Enrollments", value: stats.enrollments, icon: TrendingUp, color: "text-purple-400" },
    { label: "Paid Enrollments", value: stats.paidEnrollments, icon: CheckCircle, color: "text-green-400" },
    { label: "Unpaid Enrollments", value: stats.unpaidEnrollments, icon: XCircle, color: "text-yellow-400" },
    { label: "Total Courses", value: stats.courses, icon: BookOpen, color: "text-orange-400" },
    { label: "Total Webinars", value: stats.webinars, icon: Activity, color: "text-cyan-400" },
    { label: "Webinar Registrations", value: stats.webinarRegs, icon: Activity, color: "text-teal-400" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: Activity, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Platform Analytics</h2>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend (Paid Only)</h3>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No revenue data yet</p>}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Enrollments Trend</h3>
          {enrollmentsByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={enrollmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No enrollment data yet</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Courses by Category</h3>
          {coursesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={coursesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {coursesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No courses yet</p>}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <button onClick={exportActivityCSV} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-1">
              {recentActivity.map((a, i) => (
                <div key={i} className="border-b border-border last:border-0">
                  <button
                    onClick={() => a.type === "enrollment" ? setExpandedActivity(expandedActivity === i ? null : i) : null}
                    className={`flex w-full items-center justify-between py-3 px-1 text-left ${a.type === "enrollment" ? "cursor-pointer hover:bg-secondary/50 rounded-lg transition-colors" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${a.type === "enrollment" ? "bg-blue-400" : "bg-green-400"}`} />
                      <div>
                        <p className="text-sm text-foreground font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.type === "enrollment" ? (
                            <span className="text-primary underline underline-offset-2">enrolled in a course</span>
                          ) : a.detail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(a.time).toLocaleDateString()}</span>
                      {a.type === "enrollment" && (
                        expandedActivity === i ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  {a.type === "enrollment" && expandedActivity === i && (
                    <div className="ml-8 mb-3 rounded-lg bg-secondary/30 p-3 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Course</span>
                        <span className="text-foreground font-medium">{a.courseName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coach</span>
                        <span className="text-foreground font-medium">{a.coachName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coach Phone</span>
                        <span className="text-foreground font-medium">{a.coachPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee</span>
                        <span className="text-foreground font-medium">{a.fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment</span>
                        <span className={`font-medium ${a.paymentStatus === "paid" ? "text-green-400" : "text-yellow-400"}`}>
                          {a.paymentStatus?.charAt(0).toUpperCase() + a.paymentStatus?.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
