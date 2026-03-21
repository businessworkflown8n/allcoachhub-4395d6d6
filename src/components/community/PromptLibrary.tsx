import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Copy, Heart, Bookmark, Search, Plus, Shield } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Marketing", "Sales", "Productivity", "Content Creation", "Research", "Automation", "Learning"];

const PromptLibrary = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", category: "Marketing", description: "", prompt_text: "", use_case: "" });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("prompt_library_items").select("*").order("likes_count", { ascending: false });
      setPrompts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const submitPrompt = async () => {
    if (!user || !form.title.trim() || !form.prompt_text.trim()) { toast.error("Title and prompt text are required"); return; }
    const { error } = await supabase.from("prompt_library_items").insert({
      user_id: user.id, title: form.title.trim(), category: form.category,
      description: form.description.trim(), prompt_text: form.prompt_text.trim(),
      use_case: form.use_case.trim(), author_role: "learner",
    });
    if (error) { toast.error("Failed to add prompt"); return; }
    toast.success("Prompt shared!");
    setShowForm(false);
    setForm({ title: "", category: "Marketing", description: "", prompt_text: "", use_case: "" });
    const { data } = await supabase.from("prompt_library_items").select("*").order("likes_count", { ascending: false });
    setPrompts(data || []);
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied to clipboard!");
  };

  const filtered = prompts.filter(p => {
    if (category !== "all" && p.category !== category) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Prompt Library</h2>
          <p className="text-sm text-muted-foreground">Discover and share powerful AI prompts.</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Share Prompt</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Share a Prompt</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Prompt title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Short description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <Textarea placeholder="Paste your prompt here..." rows={5} value={form.prompt_text} onChange={e => setForm(p => ({ ...p, prompt_text: e.target.value }))} />
              <Input placeholder="Use case (e.g., Email marketing)" value={form.use_case} onChange={e => setForm(p => ({ ...p, use_case: e.target.value }))} />
              <Button onClick={submitPrompt} className="w-full">Share Prompt</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search prompts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button size="sm" variant={category === "all" ? "default" : "outline"} onClick={() => setCategory("all")}>All</Button>
          {CATEGORIES.map(c => (
            <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)} className="whitespace-nowrap">{c}</Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No prompts found. Share the first one!</CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(prompt => (
          <Card key={prompt.id} className="transition-all hover:border-primary/30 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className="text-xs">{prompt.category}</Badge>
                <div className="flex items-center gap-1">
                  {prompt.author_role === "coach" && <Badge className="text-xs bg-primary/20 text-primary border-0"><Shield className="mr-1 h-3 w-3" />Coach</Badge>}
                </div>
              </div>
              <h3 className="font-semibold text-foreground">{prompt.title}</h3>
              {prompt.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{prompt.description}</p>}
              {prompt.use_case && <p className="mt-1 text-xs text-muted-foreground">Use case: {prompt.use_case}</p>}

              {expanded === prompt.id && (
                <div className="mt-3 rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm text-foreground font-mono whitespace-pre-wrap">{prompt.prompt_text}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{prompt.likes_count}</span>
                  <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{prompt.saves_count}</span>
                  <span className="flex items-center gap-1"><Copy className="h-3 w-3" />{prompt.copies_count}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)}>
                    {expanded === prompt.id ? "Hide" : "View"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copyPrompt(prompt.prompt_text)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PromptLibrary;
