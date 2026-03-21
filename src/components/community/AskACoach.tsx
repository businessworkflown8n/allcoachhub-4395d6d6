import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, Plus, MessageSquare, Eye, CheckCircle, Search, Shield } from "lucide-react";
import { toast } from "sonner";

const AskACoach = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any[]>>({});
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", topic_id: "", skill_level: "beginner" });
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [qRes, tRes] = await Promise.all([
        supabase.from("community_questions").select("*").order("created_at", { ascending: false }),
        supabase.from("community_topics").select("id, title").eq("is_active", true),
      ]);
      setQuestions(qRes.data || []);
      setTopics(tRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const loadAnswers = async (questionId: string) => {
    if (answers[questionId]) { setExpandedQ(expandedQ === questionId ? null : questionId); return; }
    const { data } = await supabase.from("community_answers").select("*").eq("question_id", questionId).order("is_best_answer", { ascending: false }).order("like_count", { ascending: false });
    setAnswers(prev => ({ ...prev, [questionId]: data || [] }));
    setExpandedQ(questionId);
  };

  const submitQuestion = async () => {
    if (!user || !form.title.trim() || !form.description.trim()) { toast.error("Please fill in title and description"); return; }
    const { error } = await supabase.from("community_questions").insert({
      user_id: user.id, title: form.title.trim(), description: form.description.trim(),
      topic_id: form.topic_id || null, skill_level: form.skill_level,
    });
    if (error) { toast.error("Failed to post question"); return; }
    toast.success("Question posted!");
    setShowForm(false);
    setForm({ title: "", description: "", topic_id: "", skill_level: "beginner" });
    const { data } = await supabase.from("community_questions").select("*").order("created_at", { ascending: false });
    setQuestions(data || []);
  };

  const filtered = questions.filter(q => {
    if (filter === "unanswered" && q.answer_count > 0) return false;
    if (filter === "resolved" && !q.is_resolved) return false;
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Ask a Coach</h2>
          <p className="text-sm text-muted-foreground">Get expert answers from experienced AI coaches.</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Ask Question</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Ask a Question</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Question title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Describe your question in detail..." rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.topic_id} onValueChange={v => setForm(p => ({ ...p, topic_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                  <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.skill_level} onValueChange={v => setForm(p => ({ ...p, skill_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={submitQuestion} className="w-full">Post Question</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["all", "unanswered", "resolved"].map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No questions found. Be the first to ask!</CardContent></Card>}

      <div className="space-y-3">
        {filtered.map(q => (
          <Card key={q.id} className="transition-colors hover:border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">{q.skill_level}</Badge>
                    {q.is_resolved ? <Badge className="text-xs bg-green-500/20 text-green-400 border-0"><CheckCircle className="mr-1 h-3 w-3" />Resolved</Badge> : <Badge variant="destructive" className="text-xs">Open</Badge>}
                  </div>
                  <h3 className="font-medium text-foreground">{q.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{q.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{q.view_count} views</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{q.answer_count} answers</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => loadAnswers(q.id)}>
                  {expandedQ === q.id ? "Hide" : "Answers"}
                </Button>
              </div>
              {expandedQ === q.id && answers[q.id] && (
                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {answers[q.id].length === 0 && <p className="text-sm text-muted-foreground">No answers yet. Be the first to help!</p>}
                  {answers[q.id].map(a => (
                    <div key={a.id} className={`rounded-lg border p-3 ${a.is_best_answer ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {a.author_role === "coach" && <Badge className="text-xs bg-primary/20 text-primary border-0"><Shield className="mr-1 h-3 w-3" />Coach</Badge>}
                        {a.is_best_answer && <Badge className="text-xs bg-green-500/20 text-green-400 border-0"><CheckCircle className="mr-1 h-3 w-3" />Best Answer</Badge>}
                      </div>
                      <p className="text-sm text-foreground">{a.answer_text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{a.like_count} likes</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AskACoach;
