import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CheckItem {
  label: string;
  done: boolean;
  link: string;
  tip: string;
}

const ProfileStrengthMeter = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const [profileRes, coursesRes, webinarsRes, websiteRes] = await Promise.all([
        supabase.from("profiles").select("full_name, bio, expertise, avatar_url, certifications, experience_years").eq("user_id", user.id).maybeSingle(),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("coach_id", user.id),
        supabase.from("webinars").select("id", { count: "exact", head: true }).eq("coach_id", user.id),
        supabase.from("coach_websites").select("id").eq("coach_id", user.id).maybeSingle(),
      ]);

      const p = profileRes.data;
      const checks: CheckItem[] = [
        { label: "Add your full name", done: !!p?.full_name, link: "/coach/profile", tip: "A name builds trust with learners" },
        { label: "Write a bio", done: !!p?.bio, link: "/coach/profile", tip: "Profiles with bios get 3x more views" },
        { label: "Add expertise & skills", done: !!p?.expertise, link: "/coach/profile", tip: "Helps us match you with the right learners" },
        { label: "Upload a profile photo", done: !!p?.avatar_url, link: "/coach/profile", tip: "Photos increase conversion by 40%" },
        { label: "Add certifications", done: !!(p?.certifications && (p.certifications as string[]).length > 0), link: "/coach/profile", tip: "Verified credentials earn trust" },
        { label: "Create your first course", done: (coursesRes.count || 0) > 0, link: "/coach/courses/new", tip: "Courses are the #1 way to earn" },
        { label: "Host a webinar", done: (webinarsRes.count || 0) > 0, link: "/coach/webinars", tip: "Webinars attract new learners" },
        { label: "Setup your brand page", done: !!websiteRes.data, link: "/coach/website", tip: "Get a shareable link to promote" },
      ];
      setItems(checks);
      setLoading(false);
    };
    check();
  }, [user]);

  if (loading) return null;

  const completed = items.filter((i) => i.done).length;
  const percent = Math.round((completed / items.length) * 100);
  const nextStep = items.find((i) => !i.done);
  const multiplier = percent >= 80 ? "2x" : percent >= 50 ? "1.5x" : "1x";

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Profile Strength</h3>
        <span className={`text-sm font-bold ${percent >= 80 ? "text-green-400" : percent >= 50 ? "text-yellow-400" : "text-red-400"}`}>
          {percent}%
        </span>
      </div>

      <Progress value={percent} className="h-3" />

      <p className="text-sm text-muted-foreground">
        {percent >= 80
          ? "🎉 Great profile! You're getting maximum visibility."
          : `Complete your profile to get ${multiplier} more leads`}
      </p>

      {nextStep && (
        <Link
          to={nextStep.link}
          className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-foreground">Next: {nextStep.label}</p>
            <p className="text-xs text-muted-foreground">{nextStep.tip}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
        </Link>
      )}

      {/* Checklist */}
      <div className="space-y-2 pt-2 border-t border-border">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-sm">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileStrengthMeter;
