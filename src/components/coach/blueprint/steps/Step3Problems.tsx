import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, RefreshCw, Plus, Trash2 } from "lucide-react";
import { generateStep } from "./blueprintApi";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const sevColor = (s: string) => s === "Critical" ? "bg-rose-500/10 text-rose-600 border-rose-500/30" : s === "Moderate" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";

export default function Step3Problems({ blueprint, update, onComplete }: any) {
  const output: any = blueprint.problems_output || { problems: [] };
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState("");

  const generate = async () => {
    setBusy(true);
    try {
      const out = await generateStep("problems", blueprint);
      update({ problems_output: out });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  const addCustom = () => {
    if (!custom.trim()) return;
    const next = { problems: [...(output.problems || []), { problem: custom, severity: "Moderate", revenue_impact: "Custom", emotional_trigger: "Custom" }] };
    update({ problems_output: next });
    setCustom("");
  };

  const remove = (i: number) => update({ problems_output: { problems: output.problems.filter((_: any, idx: number) => idx !== i) } });
  const setSev = (i: number, sev: string) => update({ problems_output: { problems: output.problems.map((p: any, idx: number) => idx === i ? { ...p, severity: sev } : p) } });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-primary" /> Step 3 · Problem Identification Engine</h2>
        <p className="text-sm text-muted-foreground mt-1">Top problems your avatar faces, ranked with revenue impact + emotional triggers.</p>
      </div>

      <Button onClick={generate} disabled={busy} className="gap-2">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {output.problems?.length ? "Regenerate" : "Generate Problem Stack"}
      </Button>

      {output.problems?.length > 0 && (
        <>
          <div className="space-y-2">
            {output.problems.map((p: any, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{p.problem}</p>
                    <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <p>💰 <strong className="text-foreground">Revenue impact:</strong> {p.revenue_impact}</p>
                      <p>💭 <strong className="text-foreground">Emotional trigger:</strong> {p.emotional_trigger}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <select value={p.severity} onChange={(e) => setSev(i, e.target.value)} className={`rounded-full border px-3 py-1 text-xs font-medium ${sevColor(p.severity)}`}>
                      <option>Critical</option><option>Moderate</option><option>Low</option>
                    </select>
                    <button onClick={() => remove(i)} className="text-muted-foreground hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input placeholder="Add custom problem..." value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} />
            <Button variant="outline" onClick={addCustom}><Plus className="h-4 w-4" /></Button>
          </div>

          <Button onClick={onComplete} size="lg">Save & Continue to Offer →</Button>
        </>
      )}
    </div>
  );
}
