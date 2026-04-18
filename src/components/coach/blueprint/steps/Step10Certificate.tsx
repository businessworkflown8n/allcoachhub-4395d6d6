import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function Step10Certificate({ blueprint, update }: any) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const finalize = async () => {
    if (!user) return;
    setBusy(true);
    const slug = blueprint.share_slug || `bp-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
    await supabase.from("coach_blueprints").update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      share_slug: slug,
      completed_steps: Array.from(new Set([...(blueprint.completed_steps || []), 10])),
    }).eq("coach_id", user.id);
    update({ is_completed: true, share_slug: slug, completed_at: new Date().toISOString() });
    toast({ title: "🎉 Blueprint Complete!", description: "Your certificate is ready." });
    setBusy(false);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "coach-blueprint.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => window.print();

  const shareUrl = blueprint.share_slug ? `${window.location.origin}/blueprint/${blueprint.share_slug}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Step 10 · Certificate & Export</h2>
        <p className="text-sm text-muted-foreground mt-1">Finalize your blueprint, download PDF, get certificate & shareable link.</p>
      </div>

      {!blueprint.is_completed ? (
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-8 text-center space-y-4">
          <Award className="h-16 w-16 text-primary mx-auto" />
          <h3 className="text-2xl font-bold text-foreground">Ready to finalize?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Locking in your blueprint will generate your certificate of completion and unlock the shareable link.</p>
          <Button onClick={finalize} disabled={busy} size="lg">{busy ? "Finalizing..." : "Complete Blueprint"}</Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border-4 border-double border-primary bg-gradient-to-br from-primary/5 via-card to-emerald-500/5 p-10 text-center space-y-4 print:shadow-none">
            <Award className="h-20 w-20 text-primary mx-auto" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Certificate of Completion</p>
            <h3 className="text-3xl font-bold text-foreground">Coach Blueprint Super App</h3>
            <p className="text-base text-muted-foreground">This certifies that</p>
            <p className="text-2xl font-bold text-primary">Coach</p>
            <p className="text-sm text-muted-foreground">has successfully completed all 10 stages of the Coach Blueprint methodology and built a validated, revenue-ready coaching business.</p>
            {blueprint.niche_output?.chosen && <p className="mt-4 italic text-sm text-foreground">"{blueprint.niche_output.chosen}"</p>}
            <p className="text-xs text-muted-foreground mt-4">Completed {new Date(blueprint.completed_at).toLocaleDateString()}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 print:hidden">
            <Button variant="outline" onClick={downloadJSON} className="gap-2"><Download className="h-4 w-4" /> Export Data</Button>
            <Button variant="outline" onClick={printPdf} className="gap-2"><Download className="h-4 w-4" /> Save as PDF</Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(shareUrl); toast({ title: "Link copied!" }); }} className="gap-2"><Share2 className="h-4 w-4" /> Copy Share Link</Button>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-4 print:hidden">
            <p className="text-xs text-muted-foreground">Public share URL:</p>
            <p className="text-sm font-mono text-foreground break-all">{shareUrl}</p>
          </div>

          <div className="flex items-center gap-2 text-emerald-600 print:hidden">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Blueprint complete — keep refining anytime.</span>
          </div>
        </>
      )}
    </div>
  );
}
