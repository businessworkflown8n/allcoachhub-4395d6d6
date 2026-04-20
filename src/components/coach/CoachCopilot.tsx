import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MODES = [
  { key: "pre_session", label: "Pre-Session Brief" },
  { key: "post_session", label: "Post-Session Summary" },
  { key: "action_plan", label: "7-Day Action Plan" },
  { key: "followup_message", label: "Follow-up Message" },
];

export default function CoachCopilot() {
  const { user } = useAuth();
  const [mode, setMode] = useState("pre_session");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!context.trim()) { toast.error("Add some context first"); return; }
    setLoading(true); setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("coach-copilot", { body: { mode, context } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data?.text || "");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => { navigator.clipboard.writeText(output); toast.success("Copied"); };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Sparkles className="h-5 w-5" /> AI Coach Copilot</h2>
        <p className="text-sm text-muted-foreground">Generate session briefs, summaries, action plans, and follow-ups</p>
      </div>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          {MODES.map((m) => <TabsTrigger key={m.key} value={m.key} className="text-xs">{m.label}</TabsTrigger>)}
        </TabsList>
        {MODES.map((m) => (
          <TabsContent key={m.key} value={m.key} className="mt-4 space-y-3">
            <div>
              <Label>Context (client name, goals, recent notes...)</Label>
              <Textarea rows={6} value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. Priya, business coach client. Last session: discussed pricing strategy. Goal: launch by Q2..." />
            </div>
            <Button onClick={generate} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-1" /> Generate</>}
            </Button>
          </TabsContent>
        ))}
      </Tabs>

      {output && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Output</h3>
            <Button size="sm" variant="outline" onClick={copy}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
          </div>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{output}</pre>
        </div>
      )}
    </div>
  );
}
