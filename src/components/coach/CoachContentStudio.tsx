import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Copy, Loader2, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const ASSET_TYPES = [
  { key: "social_post", mode: "content_social", label: "Social Post" },
  { key: "email", mode: "content_email", label: "Email" },
  { key: "blog", mode: "content_blog", label: "Blog Draft" },
  { key: "worksheet", mode: "content_worksheet", label: "Worksheet" },
];

interface Asset { id: string; asset_type: string; title: string; content: string; created_at: string; }

export default function CoachContentStudio() {
  const { user } = useAuth();
  const [tab, setTab] = useState("generate");
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("coach_content_assets").select("*").eq("coach_id", user.id).order("created_at", { ascending: false });
    setAssets((data || []) as any);
  };
  useEffect(() => { load(); }, [user]);

  const generate = async () => {
    if (!notes.trim()) { toast.error("Add session notes first"); return; }
    setLoading(true); setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("coach-copilot", { body: { mode: assetType.mode, context: notes } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data?.text || "");
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!user || !output.trim()) return;
    const { error } = await supabase.from("coach_content_assets").insert({
      coach_id: user.id, asset_type: assetType.key, title: title || `${assetType.label} - ${new Date().toLocaleDateString()}`, content: output, prompt_used: notes,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Saved to library"); load();
  };

  const remove = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("coach_content_assets").delete().eq("id", id); load(); };
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><FileText className="h-5 w-5" /> Content Studio</h2>
        <p className="text-sm text-muted-foreground">Turn session notes into social posts, emails, blogs, and worksheets</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="library">Library ({assets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {ASSET_TYPES.map((t) => (
              <Button key={t.key} size="sm" variant={assetType.key === t.key ? "default" : "outline"} onClick={() => setAssetType(t)}>{t.label}</Button>
            ))}
          </div>
          <div><Label>Session Notes / Source Material</Label><Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste session notes, key insights, client wins..." /></div>
          <Button onClick={generate} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-1" /> Generate {assetType.label}</>}
          </Button>

          {output && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="max-w-xs" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(output)}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                  <Button size="sm" onClick={save}><Save className="h-3 w-3 mr-1" /> Save</Button>
                </div>
              </div>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{output}</pre>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="mt-4 space-y-3">
          {assets.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl"><FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">No saved content yet.</p></div>
          ) : assets.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="font-semibold text-foreground">{a.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs">{a.asset_type.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(a.content)}><Copy className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans line-clamp-6">{a.content}</pre>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
