import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Users, Video, UserCheck, DollarSign, IndianRupee, ChevronDown, ChevronUp, Rocket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCoachFeatures } from "@/hooks/useCoachFeatures";
import GrowthTools from "./GrowthTools";
import ProfileStrengthMeter from "./ProfileStrengthMeter";
import AIClientMatching from "./AIClientMatching";
import CoachLockedFeatures from "./CoachLockedFeatures";
import CoachCategoryCounts from "./CoachCategoryCounts";

const USD_TO_INR_FALLBACK = 83.5;

const CoachOverview = () => {
  const { user } = useAuth();
  const features: any = useCoachFeatures();
  const [stats, setStats] = useState({ courses: 0, enrollments: 0, webinars: 0, registrations: 0 });
  const [loading, setLoading] = useState(true);

  // Payable state
  const [payableData, setPayableData] = useState({
    courseCommissionUSD: 0,
    courseCommissionINR: 0,
    webinarCommissionUSD: 0,
    webinarCommissionINR: 0,
    courseCommissionPercent: 20,
    webinarCommissionPercent: 1,
  });
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [usdToInr, setUsdToInr] = useState(USD_TO_INR_FALLBACK);

  useEffect(() => {
    if (!user) return;

    // Fetch exchange rate
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => { if (data?.rates?.INR) setUsdToInr(data.rates.INR); })
      .catch(() => {});

    const fetchAll = async () => {
      // Stats
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

      // Payable calculation
      const [enrollData, courseCommRes, defaultCommRes, webinarCommCoachRes, defaultWebinarCommRes] = await Promise.all([
        supabase.from("enrollments").select("*, courses(price_usd, price_inr)").eq("coach_id", user.id).eq("payment_status", "paid"),
        supabase.from("coach_commissions").select("commission_percent").eq("coach_id", user.id).maybeSingle(),
        supabase.from("platform_settings").select("value").eq("key", "commission_percent").single(),
        supabase.from("coach_webinar_commissions").select("commission_percent").eq("coach_id", user.id).maybeSingle(),
        supabase.from("platform_settings").select("value").eq("key", "webinar_commission_percent").single(),
      ]);

      const courseComm = courseCommRes.data?.commission_percent ?? Number(defaultCommRes.data?.value || 20);
      const webinarComm = webinarCommCoachRes.data?.commission_percent ?? Number(defaultWebinarCommRes.data?.value || 1);

      // Course commission
      let cUSD = 0, cINR = 0;
      (enrollData.data || []).forEach((e: any) => {
        const course = e.courses as any;
        if (e.currency === "USD") {
          cUSD += Number(course?.price_usd || 0) * (courseComm / 100);
        } else {
          cINR += Number(course?.price_inr || 0) * (courseComm / 100);
        }
      });

      // Webinar commission calculated based on course fees
      let wUSD = 0, wINR = 0;
      (enrollData.data || []).forEach((e: any) => {
        const course = e.courses as any;
        if (e.currency === "USD") {
          wUSD += Number(course?.price_usd || 0) * (webinarComm / 100);
        } else {
          wINR += Number(course?.price_inr || 0) * (webinarComm / 100);
        }
      });

      setPayableData({
        courseCommissionUSD: cUSD,
        courseCommissionINR: cINR,
        webinarCommissionUSD: wUSD,
        webinarCommissionINR: wINR,
        courseCommissionPercent: courseComm,
        webinarCommissionPercent: webinarComm,
      });

      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const cards = [
    { label: "Total Courses", value: stats.courses, icon: BookOpen, color: "text-primary" },
    { label: "Students Enrolled", value: stats.enrollments, icon: Users, color: "text-green-500" },
    { label: "Total Webinars", value: stats.webinars, icon: Video, color: "text-blue-500" },
    { label: "Webinar Registrations", value: stats.registrations, icon: UserCheck, color: "text-orange-500" },
  ];

  const totalPayableUSD = payableData.courseCommissionUSD + payableData.webinarCommissionUSD + (payableData.courseCommissionINR + payableData.webinarCommissionINR) / usdToInr;
  const totalPayableINR = (payableData.courseCommissionUSD + payableData.webinarCommissionUSD) * usdToInr + payableData.courseCommissionINR + payableData.webinarCommissionINR;

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>

      {features.blueprint_access !== false && (
        <Link to="/coach/blueprint" className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-emerald-500/5 p-6 hover:border-primary/60 transition-all">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/20 p-3"><Rocket className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Coach Blueprint Super App ✨</h3>
                <p className="text-sm text-muted-foreground mt-1">From idea → validated, revenue-generating coaching business in 10 AI-powered steps.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
        </Link>
      )}
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

      {/* Total Payable to Admin */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Total Payable to Admin (AiCoach Portal)</h3>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showBreakdown ? "Hide" : "View"} Breakdown
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Grand Total (USD)</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${totalPayableUSD.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Grand Total (INR)</span>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{totalPayableINR.toFixed(2)}</p>
          </div>
        </div>

        {showBreakdown && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Course Commission ({payableData.courseCommissionPercent}%)</p>
                <p className="text-xs text-muted-foreground">From paid course enrollments</p>
              </div>
              <div className="text-right">
                {payableData.courseCommissionUSD > 0 && <p className="text-sm font-semibold text-foreground">${payableData.courseCommissionUSD.toFixed(2)}</p>}
                {payableData.courseCommissionINR > 0 && <p className="text-sm font-semibold text-foreground">₹{payableData.courseCommissionINR.toFixed(2)}</p>}
                {payableData.courseCommissionUSD === 0 && payableData.courseCommissionINR === 0 && <p className="text-sm text-muted-foreground">$0.00</p>}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Webinar Commission ({payableData.webinarCommissionPercent}%)</p>
                <p className="text-xs text-muted-foreground">From paid webinar registrations</p>
              </div>
              <div className="text-right">
                {payableData.webinarCommissionUSD > 0 && <p className="text-sm font-semibold text-foreground">${payableData.webinarCommissionUSD.toFixed(2)}</p>}
                {payableData.webinarCommissionINR > 0 && <p className="text-sm font-semibold text-foreground">₹{payableData.webinarCommissionINR.toFixed(2)}</p>}
                {payableData.webinarCommissionUSD === 0 && payableData.webinarCommissionINR === 0 && <p className="text-sm text-muted-foreground">$0.00</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Strength & AI Matching */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileStrengthMeter />
        <AIClientMatching />
      </div>

      <CoachLockedFeatures />

      <GrowthTools />
    </div>
  );
};

export default CoachOverview;
