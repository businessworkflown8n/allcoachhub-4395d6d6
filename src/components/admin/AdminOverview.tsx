import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, GraduationCap, DollarSign } from "lucide-react";

const AdminOverview = () => {
  const [stats, setStats] = useState({ coaches: 0, learners: 0, revenue: 0, enrollments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [coaches, learners, payments, enrollments] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "coach"),
        supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "learner"),
        supabase.from("payments").select("amount").eq("status", "paid"),
        supabase.from("enrollments").select("id", { count: "exact" }),
      ]);

      setStats({
        coaches: coaches.count || 0,
        learners: learners.count || 0,
        revenue: (payments.data || []).reduce((s, p) => s + Number(p.amount), 0),
        enrollments: enrollments.count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Platform Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Coaches", value: stats.coaches, icon: Users, color: "text-primary" },
          { label: "Total Learners", value: stats.learners, icon: GraduationCap, color: "text-blue-400" },
          { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
          { label: "Total Enrollments", value: stats.enrollments, icon: BarChart3, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <s.icon className={`h-6 w-6 ${s.color} mb-3`} />
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
