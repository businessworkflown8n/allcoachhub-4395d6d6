import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props { open: boolean; onClose: () => void; }

interface InsightResult {
  demandScore: number;
  competitionLevel: string;
  suggestedPricing: string;
  topicIdeas: string[];
}

const DemandInsightsPanel = ({ open, onClose }: Props) => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InsightResult | null>(null);

  const handleExplore = async () => {
    if (!keyword.trim()) { toast.error("Enter a keyword"); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("demand-insights", {
        body: { keyword },
      });
      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch insights");
    } finally {
      setLoading(false);
    }
  };

  const Badge = ({ label, color }: { label: string; color: string }) => (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{label}</span>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Demand Insights</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Topic / Keyword</label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. AI coaching, leadership..."
              className="mt-1"
            />
          </div>

          <Button onClick={handleExplore} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : "Explore Insights"}
          </Button>

          {result && (
            <div className="space-y-4 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Demand Score</span>
                <span className="text-2xl font-bold text-primary">{result.demandScore}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Competition</span>
                <Badge
                  label={result.competitionLevel}
                  color={result.competitionLevel === "Low" ? "bg-emerald-500/20 text-emerald-400" : result.competitionLevel === "Medium" ? "bg-amber-500/20 text-amber-400" : "bg-destructive/20 text-destructive"}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Suggested Pricing</span>
                <span className="font-semibold text-foreground">{result.suggestedPricing}</span>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Topic Ideas</p>
                <ul className="space-y-1">
                  {result.topicIdeas.map((t, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DemandInsightsPanel;
