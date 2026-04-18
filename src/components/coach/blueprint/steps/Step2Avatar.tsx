import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, User, RefreshCw } from "lucide-react";
import { generateStep } from "../blueprintApi";
import { toast } from "@/hooks/use-toast";

export default function Step2Avatar({ blueprint, update, onComplete }: any) {
  const inputs = blueprint.avatar_inputs || {};
  const output = blueprint.avatar_output || {};
  const [busy, setBusy] = useState(false);
  const setInput = (k: string, v: string) => update({ avatar_inputs: { ...inputs, [k]: v } });

  const generate = async () => {
    setBusy(true);
    try {
      const out = await generateStep("avatar", blueprint);
      update({ avatar_output: out });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><User className="h-6 w-6 text-primary" /> Step 2 · Ideal Client Avatar Engine</h2>
        <p className="text-sm text-muted-foreground mt-1">AI builds a vivid persona based on your inputs.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Age range (e.g., 28-45)" value={inputs.age || ""} onChange={(e) => setInput("age", e.target.value)} />
        <Input placeholder="Income range (e.g., ₹10-25L/yr)" value={inputs.income || ""} onChange={(e) => setInput("income", e.target.value)} />
        <Input placeholder="Profession" value={inputs.profession || ""} onChange={(e) => setInput("profession", e.target.value)} />
        <Input placeholder="Platforms they use (Instagram, LinkedIn...)" value={inputs.platforms || ""} onChange={(e) => setInput("platforms", e.target.value)} />
        <Textarea className="md:col-span-2" placeholder="Their current struggles" value={inputs.struggles || ""} onChange={(e) => setInput("struggles", e.target.value)} rows={2} />
        <Textarea className="md:col-span-2" placeholder="Their desired outcomes" value={inputs.outcomes || ""} onChange={(e) => setInput("outcomes", e.target.value)} rows={2} />
      </div>

      <Button onClick={generate} disabled={busy} className="gap-2">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {output.persona_name ? "Regenerate Avatar" : "Generate Avatar"}
      </Button>

      {output.persona_name && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-card p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-2xl font-bold text-foreground">{output.persona_name}</h3>
              <div className="text-right text-xs">
                <p className="text-muted-foreground">Pain Intensity</p>
                <p className="text-2xl font-bold text-rose-500">{output.pain_intensity}/10</p>
              </div>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{output.persona_story}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-secondary px-3 py-1">{output.demographics?.age}</span>
              <span className="rounded-full bg-secondary px-3 py-1">{output.demographics?.income}</span>
              <span className="rounded-full bg-secondary px-3 py-1">{output.demographics?.profession}</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1">Buying capacity: {output.buying_capacity}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">Top Objections</h4>
              <ul className="space-y-2 text-sm">
                {output.objections?.map((o: any, i: number) => (
                  <li key={i}><strong className="text-foreground">{o.objection}</strong><p className="text-xs text-muted-foreground mt-0.5">→ {o.counter}</p></li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">Buying Triggers</h4>
              <ul className="space-y-1.5 text-sm text-foreground">
                {output.buying_triggers?.map((t: string, i: number) => <li key={i}>⚡ {t}</li>)}
              </ul>
            </div>
          </div>

          <Button onClick={onComplete} size="lg">Save & Continue to Problems →</Button>
        </div>
      )}
    </div>
  );
}
