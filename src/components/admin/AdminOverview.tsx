import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, GraduationCap, DollarSign, TrendingUp, BookOpen, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

const AdminOverview = () => {
  const [stats, setStats] = useState({ coaches: 0, learners: 0, revenue: 0, enrollments: 0, courses: 0, reviews: 0 });
  const [enrollmentsByMonth, setEnrollmentsByMonth] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [coursesByCategory, setCoursesByCategory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [coaches, learners, payments, enrollments, courses, reviews] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "coach"),
        supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "learner"),
        supabase.from("payments").select("*").eq("status", "paid"),
        supabase.from("enrollments").select("*").order("enrolled_at", { ascending: false }),
        supabase.from("courses").select("*"),
        supabase.from("reviews").select("id", { count: "exact" }),
      ]);

      const payData = payments.data || [];
      const enrollData = enrollments.data || [];
      const courseData = courses.data || [];

      setStats({
        coaches: coaches.count || 0,
        learners: learners.count || 0,
        revenue: payData.reduce((s, p) => s + Number(p.amount), 0),
        enrollments: enrollments.count || 0,
        courses: courseData.length,
        reviews: reviews.count || 0,
      });

      // Enrollments by month
      const monthMap: Record<string, number> = {};
      enrollData.forEach((e) => {
        const m = new Date(e.enrolled_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
        monthMap[m] = (monthMap[m] || 0) + 1;
      });
      setEnrollmentsByMonth(Object.entries(monthMap).slice(-6).map(([month, count]) => ({ month, count })));

      // Revenue by month
      const revMap: Record<string, number> = {};
      payData.forEach((p) => {
        const m = new Date(p.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
        revMap[m] = (revMap[m] || 0) + Number(p.amount);
      });
      setRevenueByMonth(Object.entries(revMap).slice(-6).map(([month, revenue]) => ({ month, revenue })));

      // Courses by category
      const catMap: Record<string, number> = {};
      courseData.forEach((c) => { catMap[c.category] = (catMap[c.category] || 0) + 1; });
      setCoursesByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // Recent activity feed
      const activities: any[] = [];
      enrollData.slice(0, 10).forEach((e) => {
        activities.push({ type: "enrollment", name: e.full_name, detail: `enrolled in a course`, time: e.enrolled_at });
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

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

  const statCards = [
    { label: "Total Coaches", value: stats.coaches, icon: Users, color: "text-primary" },
    { label: "Total Learners", value: stats.learners, icon: GraduationCap, color: "text-blue-400" },
    { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
    { label: "Total Enrollments", value: stats.enrollments, icon: TrendingUp, color: "text-purple-400" },
    { label: "Total Courses", value: stats.courses, icon: BookOpen, color: "text-orange-400" },
    { label: "Total Reviews", value: stats.reviews, icon: Activity, color: "text-pink-400" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Platform Analytics</h2>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        {/* Revenue trend */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h3>
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

        {/* Enrollments trend */}
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
        {/* Courses by category */}
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

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${a.type === "enrollment" ? "bg-blue-400" : "bg-green-400"}`} />
                    <div>
                      <p className="text-sm text-foreground font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(a.time).toLocaleDateString()}</span>
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
