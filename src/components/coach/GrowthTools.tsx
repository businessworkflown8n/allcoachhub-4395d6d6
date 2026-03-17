import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Video, TrendingUp, Tag, Package, Copy, DollarSign, BarChart3, Award } from "lucide-react";
import ContentReviewModal from "./growth/ContentReviewModal";
import DemandInsightsPanel from "./growth/DemandInsightsPanel";
import CouponManager from "./growth/CouponManager";
import BundleCreator from "./growth/BundleCreator";
import DuplicateProgram from "./growth/DuplicateProgram";

const GrowthTools = () => {
  const { user } = useAuth();
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState({ couponRevenue: 0, bundleSales: 0, topCoupon: "—" });

  useEffect(() => {
    if (!user) return;
    const fetchSnapshot = async () => {
      const [couponsRes, bundlesRes] = await Promise.all([
        supabase.from("coupons").select("code, revenue_generated, usage_count").eq("coach_id", user.id).order("usage_count", { ascending: false }),
        supabase.from("program_bundles").select("sales_count, revenue_generated").eq("coach_id", user.id),
      ]);
      const couponRevenue = (couponsRes.data || []).reduce((s, c) => s + (Number(c.revenue_generated) || 0), 0);
      const bundleSales = (bundlesRes.data || []).reduce((s, b) => s + (Number(b.sales_count) || 0), 0);
      const topCoupon = couponsRes.data?.[0]?.code || "—";
      setSnapshot({ couponRevenue, bundleSales, topCoupon });
    };
    fetchSnapshot();
  }, [user]);

  const tools = [
    { id: "content-review", title: "Content Review", desc: "Upload a short video and get AI-powered feedback on quality and engagement.", cta: "Analyze Video", icon: Video, color: "text-blue-400" },
    { id: "demand-insights", title: "Demand Insights", desc: "Discover high-demand coaching topics with low competition.", cta: "Explore Insights", icon: TrendingUp, color: "text-emerald-400" },
    { id: "coupons", title: "Create Offers", desc: "Create and track discount coupons for your programs.", cta: "Create Offer", icon: Tag, color: "text-amber-400" },
    { id: "bundles", title: "Bundle Programs", desc: "Combine multiple programs to increase sales.", cta: "Create Bundle", icon: Package, color: "text-purple-400" },
    { id: "duplicate", title: "Duplicate Program", desc: "Clone existing programs to scale faster.", cta: "Duplicate", icon: Copy, color: "text-pink-400" },
  ];

  const snapshotCards = [
    { label: "Revenue from Offers", value: `$${snapshot.couponRevenue.toFixed(0)}`, icon: DollarSign },
    { label: "Bundle Sales", value: snapshot.bundleSales.toString(), icon: BarChart3 },
    { label: "Top Performing Coupon", value: snapshot.topCoupon, icon: Award },
  ];

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-bold text-foreground">🚀 Growth Tools</h2>

      {/* Performance Snapshot */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Tools Performance Snapshot</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {snapshotCards.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
              <s.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <t.icon className={`h-5 w-5 ${t.color}`} />
                <h3 className="font-semibold text-foreground">{t.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
            </div>
            <button
              onClick={() => setOpenTool(t.id)}
              className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Modals / Panels */}
      <ContentReviewModal open={openTool === "content-review"} onClose={() => setOpenTool(null)} />
      <DemandInsightsPanel open={openTool === "demand-insights"} onClose={() => setOpenTool(null)} />
      <CouponManager open={openTool === "coupons"} onClose={() => setOpenTool(null)} />
      <BundleCreator open={openTool === "bundles"} onClose={() => setOpenTool(null)} />
      <DuplicateProgram open={openTool === "duplicate"} onClose={() => setOpenTool(null)} />
    </div>
  );
};

export default GrowthTools;
