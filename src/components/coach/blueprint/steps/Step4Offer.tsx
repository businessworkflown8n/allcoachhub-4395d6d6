import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Package, RefreshCw } from "lucide-react";
import { generateStep } from "./blueprintApi";
import { toast } from "@/hooks/use-toast";

export default function Step4Offer({ blueprint, update, onComplete }: any) {
  const output = blueprint.offer_output || {};
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const out = await generateStep("offer", blueprint);
      update({ offer_output: out, offer_score: out.offer_score });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  const choose = (name: string) => update({ offer_output: { ...output, chosen_name: name } });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Step 4 · Offer Creation Engine</h2>
        <p className="text-sm text-muted-foreground mt-1">High-converting program with transformation, format, guarantee, bonuses.</p>
      </div>

      <Button onClick={generate} disabled={busy} className="gap-2">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {output.chosen_name ? "Regenerate Offer" : "Generate Offer"}
      </Button>

      {output.chosen_name && (
        <>
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-card p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Program Name</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">{output.chosen_name}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Offer Score</p>
                <p className="text-3xl font-bold text-emerald-500">{output.offer_score}/100</p>
              </div>
            </div>
            <p className="text-base font-medium text-primary mt-3">"{output.transformation_promise}"</p>
            <span className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs">{output.delivery_format}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">Structure</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{output.structure}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">Guarantee</h4>
              <p className="text-sm text-muted-foreground">{output.guarantee}</p>
              <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">Bonuses</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {output.bonuses?.map((b: string, i: number) => <li key={i}>🎁 {b}</li>)}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Other name options:</h4>
            <div className="flex flex-wrap gap-2">
              {output.program_names?.map((n: string) => (
                <button key={n} onClick={() => choose(n)} className={`rounded-full border px-3 py-1.5 text-xs ${output.chosen_name === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>{n}</button>
              ))}
            </div>
          </div>

          <Button onClick={onComplete} size="lg">Save & Continue to Pricing →</Button>
        </>
      )}
    </div>
  );
}
