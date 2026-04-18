import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Target, TrendingUp, RefreshCw } from "lucide-react";
import { generateStep } from "../blueprintApi";
import { toast } from "@/hooks/use-toast";

export default function Step1Niche({ blueprint, update, onComplete }: any) {
  const inputs = blueprint.niche_inputs || {};
  const output = blueprint.niche_output || {};
  const [busy, setBusy] = useState(false);

  const setInput = (k: string, v: string) => update({ niche_inputs: { ...inputs, [k]: v } });

  const generate = async () => {
    if (!inputs.problem || !inputs.audience || !inputs.result) {
      toast({ title: "Fill all 3 fields first", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const out = await generateStep("niche", blueprint);
      update({ niche_output: out, niche_score: out.positioning_score });
      toast({ title: "Niche generated!" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const choose = (statement: string) => update({ niche_output: { ...output, chosen: statement } });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Target className="h-6 w-6 text-primary" /> Step 1 · Niche Clarity Engine</h2>
        <p className="text-sm text-muted-foreground mt-1">Define exactly who you help and what transformation you deliver.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">What problem do you solve?</label>
          <Textarea value={inputs.problem || ""} onChange={(e) => setInput("problem", e.target.value)} placeholder="e.g., Coaches struggle to scale beyond 1:1" rows={3} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Who do you help?</label>
          <Textarea value={inputs.audience || ""} onChange={(e) => setInput("audience", e.target.value)} placeholder="e.g., Established coaches earning ₹5L/mo" rows={3} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">What result do you promise?</label>
          <Textarea value={inputs.result || ""} onChange={(e) => setInput("result", e.target.value)} placeholder="e.g., Hit ₹25L/mo with group coaching in 90 days" rows={3} />
        </div>
      </div>

      <Button onClick={generate} disabled={busy} className="gap-2">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {output.variations ? "Regenerate" : "Generate Niche"}
      </Button>

      {output.variations && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Positioning Score</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-4xl font-bold text-foreground">{output.positioning_score}<span className="text-lg text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground mt-2">{output.score_rationale}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <span className="text-sm text-muted-foreground">Market Demand</span>
              <p className="text-3xl font-bold text-primary mt-2">{output.market_demand}</p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {output.improvement_tips?.slice(0, 3).map((t: string, i: number) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Choose your niche statement:</h3>
            {output.variations.map((v: any, i: number) => (
              <button key={i} onClick={() => choose(v.statement)} className={`w-full text-left rounded-lg border p-4 transition-all ${output.chosen === v.statement ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                <p className="text-sm font-medium text-foreground">{v.statement}</p>
                <p className="text-xs text-muted-foreground mt-1">Angle: {v.angle}</p>
              </button>
            ))}
          </div>

          {output.chosen && (
            <Button onClick={onComplete} variant="default" size="lg">Save & Continue to Avatar →</Button>
          )}
        </div>
      )}
    </div>
  );
}
