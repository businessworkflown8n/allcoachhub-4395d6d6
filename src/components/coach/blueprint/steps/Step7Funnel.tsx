import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Megaphone, RefreshCw } from "lucide-react";
import { generateStep } from "../blueprintApi";
import { toast } from "@/hooks/use-toast";

export default function Step7Funnel({ blueprint, update, onComplete }: any) {
  const output = blueprint.funnel_output || {};
  const [busy, setBusy] = useState(false);
  const generate = async () => {
    setBusy(true);
    try {
      const out = await generateStep("funnel", blueprint);
      update({ funnel_output: out });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> Step 7 · Funnel & Growth Engine</h2>
        <p className="text-sm text-muted-foreground mt-1">Marketing blueprint with funnel type, lead-gen, content, ad copy, platforms.</p>
      </div>

      <Button onClick={generate} disabled={busy} className="gap-2">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {output.funnel_type ? "Regenerate" : "Generate Funnel"}
      </Button>

      {output.funnel_type && (
        <>
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-card p-5">
            <p className="text-xs uppercase text-muted-foreground">Recommended funnel</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{output.funnel_type}</h3>
            <p className="text-sm text-muted-foreground mt-2">{output.lead_gen_strategy}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {output.platforms?.map((p: string) => <span key={p} className="rounded-full bg-secondary px-3 py-1 text-xs">{p}</span>)}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">Content Plan</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {output.content_plan?.map((c: string, i: number) => <li key={i}>• {c}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">Landing Page Framework</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{output.landing_page_framework}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Ad Copy Suggestions</h4>
            {output.ad_copy?.map((a: any, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <p className="font-bold text-foreground">{a.headline}</p>
                <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
              </div>
            ))}
          </div>

          <Button onClick={onComplete} size="lg">Save & Continue to Roadmap →</Button>
        </>
      )}
    </div>
  );
}
