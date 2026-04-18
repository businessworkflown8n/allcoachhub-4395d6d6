import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Map, RefreshCw } from "lucide-react";
import { generateStep } from "./blueprintApi";
import { toast } from "@/hooks/use-toast";

export default function Step8Roadmap({ blueprint, update, onComplete }: any) {
  const output = blueprint.roadmap_output || {};
  const [busy, setBusy] = useState(false);
  const generate = async () => {
    setBusy(true);
    try {
      const out = await generateStep("roadmap", blueprint);
      update({ roadmap_output: out });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Map className="h-6 w-6 text-primary" /> Step 8 · Execution Roadmap</h2>
        <p className="text-sm text-muted-foreground mt-1">30/60/90-day roadmap with weekly tasks and KPIs.</p>
      </div>

      <Button onClick={generate} disabled={busy} className="gap-2">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {output.phases ? "Regenerate" : "Generate Roadmap"}
      </Button>

      {output.phases && (
        <>
          <div className="space-y-4">
            {output.phases.map((p: any, i: number) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-transparent p-4">
                  <p className="text-xs uppercase text-muted-foreground">{p.name}</p>
                  <h4 className="font-bold text-foreground mt-1">{p.goal}</h4>
                </div>
                <div className="divide-y divide-border">
                  {p.weeks?.map((w: any, j: number) => (
                    <div key={j} className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Week {w.week}: {w.focus}</p>
                        <span className="text-xs rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5">KPI: {w.kpi}</span>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {w.tasks?.map((t: string, k: number) => <li key={k}>☐ {t}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={onComplete} size="lg">Save & Continue to Dashboard →</Button>
        </>
      )}
    </div>
  );
}
