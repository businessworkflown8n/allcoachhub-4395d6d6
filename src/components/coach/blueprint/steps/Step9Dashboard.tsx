import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

export default function Step9Dashboard({ blueprint, onComplete }: any) {
  const pricing = blueprint.pricing_output || {};
  const funnel = blueprint.funnel_output || {};
  const completionPct = Math.round(((blueprint.completed_steps?.length || 0) / 10) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Step 9 · Business Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Forecast, funnel metrics, lead tracking and progress.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Revenue Forecast (50)</p><DollarSign className="h-4 w-4 text-emerald-500" /></div>
          <p className="text-2xl font-bold text-foreground mt-2">₹{(pricing.revenue_simulation?.at_50 || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Conversion %</p><TrendingUp className="h-4 w-4 text-primary" /></div>
          <p className="text-2xl font-bold text-foreground mt-2">{pricing.conversion_benchmark_pct || 0}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Funnel</p><Users className="h-4 w-4 text-blue-500" /></div>
          <p className="text-lg font-bold text-foreground mt-2">{funnel.funnel_type || "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Blueprint Completion</p>
          <p className="text-2xl font-bold text-foreground mt-2">{completionPct}%</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-2">
            <div className="h-full bg-gradient-to-r from-primary to-emerald-500" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Step-by-Step Status</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {["Niche", "Avatar", "Problems", "Offer", "Pricing", "Curriculum", "Funnel", "Roadmap", "Dashboard", "Certificate"].map((label, i) => (
            <div key={i} className={`rounded-lg border p-2 text-center ${blueprint.completed_steps?.includes(i + 1) ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : "border-border text-muted-foreground"}`}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <Button onClick={onComplete} size="lg">Continue to Certificate →</Button>
    </div>
  );
}
