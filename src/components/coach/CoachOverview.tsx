import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Users, Video, UserCheck } from "lucide-react";
import GrowthTools from "./GrowthTools";

const CoachOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, enrollments: 0, webinars: 0, registrations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [coursesRes, enrollmentsRes, webinarsRes, regsRes] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("coach_id", user.id),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("coach_id", user.id),
        supabase.from("webinars").select("id", { count: "exact", head: true }).eq("coach_id", user.id),
        supabase.from("webinars").select("id").eq("coach_id", user.id).then(async ({ data: wbs }) => {
          if (!wbs?.length) return { count: 0 };
          const { count } = await supabase
            .from("webinar_registrations")
            .select("id", { count: "exact", head: true })
            .in("webinar_id", wbs.map((w) => w.id));
          return { count: count || 0 };
        }),
      ]);
      setStats({
        courses: coursesRes.count || 0,
        enrollments: enrollmentsRes.count || 0,
        webinars: webinarsRes.count || 0,
        registrations: regsRes.count || 0,
      });
      setLoading(false);
    };
    fetch();
  }, [user]);

  const cards = [
    { label: "Total Courses", value: stats.courses, icon: BookOpen, color: "text-primary" },
    { label: "Students Enrolled", value: stats.enrollments, icon: Users, color: "text-green-500" },
    { label: "Total Webinars", value: stats.webinars, icon: Video, color: "text-blue-500" },
    { label: "Webinar Registrations", value: stats.registrations, icon: UserCheck, color: "text-orange-500" },
  ];

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
      <GrowthTools />
    </div>
  );
};

export default CoachOverview;
