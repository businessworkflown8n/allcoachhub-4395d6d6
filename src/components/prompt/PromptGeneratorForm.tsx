import { useState } from "react";
import { Sparkles, RefreshCw, Copy, Check, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PROMPT_TYPES = ["Marketing", "Copywriting", "Automation", "AI Tools", "Coding", "Custom"];
const PLATFORMS = ["Google Ads", "Meta", "LinkedIn", "Email", "Twitter/X", "Instagram", "YouTube", "Website", "Other"];
const TONES = ["Professional", "Casual", "Persuasive", "Friendly", "Authoritative", "Humorous", "Urgent", "Inspirational"];

interface Props {
  compact?: boolean;
  showSave?: boolean;
  userRole?: string;
}

const PromptGeneratorForm = ({ compact = false, showSave = false, userRole }: Props) => {
  const [promptType, setPromptType] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("");
  const [tone, setTone] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGenerate = async () => {
    if (!promptType || !goal) {
      toast({ title: "Missing fields", description: "Please select a prompt type and enter a goal.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-prompt", {
        body: { promptType, goal, audience, platform, tone, additionalContext },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedPrompt(data.prompt);
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast({ title: "Copied!", description: "Prompt copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!user || !generatedPrompt) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("generated_prompts" as any).insert({
        user_id: user.id,
        role: userRole || "learner",
        prompt_type: promptType,
        input_data: { goal, audience, platform, tone, additionalContext },
        output_prompt: generatedPrompt,
      } as any);
      if (error) throw error;
      toast({ title: "Saved!", description: "Prompt saved to your library." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={compact ? "space-y-3" : "grid gap-4 md:grid-cols-2"}>
        <div className="space-y-1.5">
          <Label>Prompt Type *</Label>
          <Select value={promptType} onValueChange={setPromptType}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {PROMPT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Goal / Objective *</Label>
          <Input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Increase sign-ups by 30%" />
        </div>
        <div className="space-y-1.5">
          <Label>Target Audience</Label>
          <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Small business owners" />
        </div>
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue placeholder="Select tone" /></SelectTrigger>
            <SelectContent>
              {TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {!compact && (
          <div className="space-y-1.5 md:col-span-2">
            <Label>Additional Context</Label>
            <Textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} placeholder="Any extra details..." rows={3} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGenerate} disabled={loading} className="gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating..." : "Generate"}
        </Button>
        {generatedPrompt && (
          <>
            <Button variant="outline" onClick={handleGenerate} disabled={loading} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Regenerate
            </Button>
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            {showSave && user && (
              <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Prompt"}
              </Button>
            )}
          </>
        )}
      </div>

      {generatedPrompt && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Generated Prompt</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{generatedPrompt}</p>
        </div>
      )}

      <a
        href="https://claude.ai/public/artifacts/117dde1a-a18c-411a-8486-1f0b36a55f01"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Open Advanced Generator
      </a>
    </div>
  );
};

export default PromptGeneratorForm;
