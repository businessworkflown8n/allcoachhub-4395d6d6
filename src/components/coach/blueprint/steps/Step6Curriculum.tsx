import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { generateStep } from "../blueprintApi";
import { toast } from "@/hooks/use-toast";

export default function Step6Curriculum({ blueprint, update, onComplete }: any) {
  const output = blueprint.curriculum_output || {};
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const generate = async () => {
    setBusy(true);
    try {
      const out = await generateStep("curriculum", blueprint);
      update({ curriculum_output: out });
      const o: any = {}; out.modules?.forEach((_: any, i: number) => o[i] = i === 0); setOpen(o);
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" /> Step 6 · Curriculum Generator</h2>
        <p className="text-sm text-muted-foreground mt-1">Full course structure with modules, lessons, action tasks, expected outcomes.</p>
      </div>

      <Button onClick={generate} disabled={busy} className="gap-2">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {output.modules ? "Regenerate Curriculum" : "Generate Curriculum"}
      </Button>

      {output.modules && (
        <>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm">Recommended duration: <strong className="text-foreground text-lg">{output.duration}</strong></p>
          </div>
          <div className="space-y-2">
            {output.modules.map((m: any, i: number) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => setOpen({ ...open, [i]: !open[i] })} className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/40">
                  <span className="font-semibold text-foreground">Module {i + 1}: {m.title}</span>
                  {open[i] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {open[i] && (
                  <div className="border-t border-border divide-y divide-border">
                    {m.lessons?.map((l: any, j: number) => (
                      <div key={j} className="p-4 space-y-1">
                        <p className="text-sm font-medium text-foreground">📘 Lesson {j + 1}: {l.title}</p>
                        <p className="text-xs text-muted-foreground"><strong>Objective:</strong> {l.objective}</p>
                        <p className="text-xs text-muted-foreground"><strong>Action:</strong> {l.action_task}</p>
                        <p className="text-xs text-emerald-600"><strong>Outcome:</strong> {l.expected_outcome}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button onClick={onComplete} size="lg">Save & Continue to Funnel →</Button>
        </>
      )}
    </div>
  );
}
