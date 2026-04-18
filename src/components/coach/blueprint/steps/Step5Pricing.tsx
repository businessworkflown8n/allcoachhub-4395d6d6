import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, IndianRupee, RefreshCw, TrendingUp } from "lucide-react";
import { generateStep } from "./blueprintApi";
import { toast } from "@/hooks/use-toast";

export default function Step5Pricing({ blueprint, update, onComplete }: any) {
  const output = blueprint.pricing_output || {};
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const out = await generateStep("pricing", blueprint);
      update({ pricing_output: out, pricing_score: out.pricing_score });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><IndianRupee className="h-6 w-6 text-primary" /> Step 5 · Pricing & Revenue Simulator</h2>
        <p className="text-sm text-muted-foreground mt-1">Tiered pricing with revenue projection, CAC, and break-even.</p>
      </div>

      <Button onClick={generate} disabled={busy} className="gap-2">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {output.ideal_price_inr ? "Regenerate" : "Generate Pricing"}
      </Button>

      {output.ideal_price_inr && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Ideal Price</p>
              <p className="text-3xl font-bold text-foreground mt-1">₹{output.ideal_price_inr.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">${output.ideal_price_usd}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Pricing Score</p>
              <p className="text-3xl font-bold text-emerald-500 mt-1">{output.pricing_score}/100</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Break-even</p>
              <p className="text-3xl font-bold text-foreground mt-1">{output.break_even_users} <span className="text-sm text-muted-foreground">users</span></p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-gradient-to-br from-emerald-500/5 to-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" />Revenue Simulation</h4>
            <div className="grid grid-cols-3 gap-4">
              {[10, 50, 100].map((u) => (
                <div key={u} className="text-center">
                  <p className="text-xs text-muted-foreground">{u} students</p>
                  <p className="text-xl font-bold text-foreground mt-1">₹{(output.revenue_simulation?.[`at_${u}`] || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Expected conversion: <strong className="text-foreground">{output.conversion_benchmark_pct}%</strong> · Est. CAC: <strong className="text-foreground">₹{output.cac_estimate_inr?.toLocaleString()}</strong></p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {output.tiers?.map((t: any, i: number) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.name}</p>
                <p className="text-2xl font-bold text-foreground mt-1">₹{t.price_inr.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">{t.includes}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground italic">{output.rationale}</p>
          <Button onClick={onComplete} size="lg">Save & Continue to Curriculum →</Button>
        </>
      )}
    </div>
  );
}
