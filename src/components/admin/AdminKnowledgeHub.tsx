import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Plus, Pencil, Eye, Trash2, Loader2, BookOpen, HelpCircle } from "lucide-react";
import { buildFaqSchema, buildArticleSchema, buildBreadcrumbSchema } from "@/lib/seoSchema";

type Topic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primary_keyword: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  is_published: boolean;
};

type Question = {
  id: string;
  topic_id: string;
  question: string;
  slug: string | null;
  ai_summary: string | null;
  detailed_explanation: string | null;
  key_takeaways: string[] | null;
  faqs: { question: string; answer: string }[] | null;
  focus_keyword: string | null;
  secondary_keywords: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  author_name: string | null;
  author_expertise: string | null;
  reviewed_by: string | null;
  is_published: boolean;
  view_count: number;
  updated_at: string;
};

const emptyTopic: Partial<Topic> = { name: "", slug: "", description: "", primary_keyword: "", sort_order: 0, is_published: false };
const emptyQuestion: Partial<Question> = {
  question: "", ai_summary: "", detailed_explanation: "", key_takeaways: [], faqs: [],
  focus_keyword: "", secondary_keywords: [], meta_title: "", meta_description: "",
  author_name: "AI Coach Portal Editorial Team", author_expertise: "AI Coaching Experts",
  is_published: false,
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const AdminKnowledgeHub = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Partial<Topic>>(emptyTopic);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question>>(emptyQuestion);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [filterTopicId, setFilterTopicId] = useState<string>("all");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [{ data: t }, { data: q }] = await Promise.all([
      supabase.from("knowledge_topics" as any).select("*").order("sort_order"),
      supabase.from("knowledge_questions" as any).select("*").order("updated_at", { ascending: false }),
    ]);
    setTopics((t as any) || []);
    setQuestions((q as any) || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredQuestions = useMemo(
    () => filterTopicId === "all" ? questions : questions.filter(q => q.topic_id === filterTopicId),
    [questions, filterTopicId]
  );

  const topicById = (id: string) => topics.find(t => t.id === id);

  /* ---------------- Topic CRUD ---------------- */
  const openTopic = (t?: Topic) => {
    setEditingTopic(t ? { ...t } : { ...emptyTopic });
    setTopicDialogOpen(true);
  };

  const saveTopic = async () => {
    if (!editingTopic.name) return toast.error("Name required");
    setSaving(true);
    const payload: any = {
      ...editingTopic,
      slug: editingTopic.slug || slugify(editingTopic.name),
    };
    const { error } = editingTopic.id
      ? await supabase.from("knowledge_topics" as any).update(payload).eq("id", editingTopic.id)
      : await supabase.from("knowledge_topics" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Topic saved");
    setTopicDialogOpen(false);
    loadData();
  };

  const deleteTopic = async (id: string) => {
    if (!confirm("Delete topic and all its questions?")) return;
    const { error } = await supabase.from("knowledge_topics" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Topic deleted");
    loadData();
  };

  /* ---------------- Question CRUD ---------------- */
  const openQuestion = (q?: Question, topicId?: string) => {
    setEditingQuestion(q ? { ...q } : { ...emptyQuestion, topic_id: topicId || filterTopicId !== "all" ? filterTopicId : topics[0]?.id });
    setQuestionDialogOpen(true);
  };

  const saveQuestion = async () => {
    if (!editingQuestion.question || !editingQuestion.topic_id) return toast.error("Question + topic required");
    setSaving(true);
    const payload: any = {
      topic_id: editingQuestion.topic_id,
      question: editingQuestion.question,
      slug: editingQuestion.slug || slugify(editingQuestion.question),
      ai_summary: editingQuestion.ai_summary,
      detailed_explanation: editingQuestion.detailed_explanation,
      key_takeaways: editingQuestion.key_takeaways || [],
      faqs: editingQuestion.faqs || [],
      focus_keyword: editingQuestion.focus_keyword,
      secondary_keywords: editingQuestion.secondary_keywords || [],
      meta_title: editingQuestion.meta_title,
      meta_description: editingQuestion.meta_description,
      author_name: editingQuestion.author_name,
      author_expertise: editingQuestion.author_expertise,
      reviewed_by: editingQuestion.reviewed_by,
      is_published: editingQuestion.is_published || false,
      published_at: editingQuestion.is_published ? new Date().toISOString() : null,
    };
    const { error } = editingQuestion.id
      ? await supabase.from("knowledge_questions" as any).update(payload).eq("id", editingQuestion.id)
      : await supabase.from("knowledge_questions" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingQuestion.is_published ? "Published — auto-indexing triggered" : "Saved as draft");
    setQuestionDialogOpen(false);
    loadData();
  };

  const togglePublish = async (q: Question) => {
    const next = !q.is_published;
    const { error } = await supabase.from("knowledge_questions" as any)
      .update({ is_published: next, published_at: next ? new Date().toISOString() : null })
      .eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Published — submitted for indexing" : "Unpublished");
    loadData();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("knowledge_questions" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    loadData();
  };

  /* ---------------- AI Generate ---------------- */
  const aiGenerate = async () => {
    if (!editingQuestion.question) return toast.error("Enter a question first");
    setGenerating(true);
    try {
      const topic = topicById(editingQuestion.topic_id || "");
      const { data, error } = await supabase.functions.invoke("knowledge-generator", {
        body: {
          question: editingQuestion.question,
          topic: topic?.name,
          focus_keyword: editingQuestion.focus_keyword || topic?.primary_keyword,
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Generation failed");
      const c = data.content;
      setEditingQuestion(prev => ({
        ...prev,
        ai_summary: c.ai_summary,
        detailed_explanation: c.detailed_explanation,
        key_takeaways: c.key_takeaways,
        faqs: c.faqs,
        meta_title: c.meta_title,
        meta_description: c.meta_description,
        focus_keyword: c.focus_keyword,
        secondary_keywords: c.secondary_keywords,
      }));
      toast.success("AI content generated — review before publishing");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  /* ---------------- Preview / Schema ---------------- */
  const buildPreviewSchemas = (q: Question) => {
    const topic = topicById(q.topic_id);
    const url = `https://www.aicoachportal.com/knowledge/${topic?.slug}/${q.slug}`;
    return [
      buildBreadcrumbSchema([
        { name: "Knowledge Hub", url: "/knowledge" },
        { name: topic?.name || "", url: `/knowledge/${topic?.slug}` },
        { name: q.question, url },
      ]),
      buildArticleSchema({
        headline: q.question,
        description: q.ai_summary || "",
        url,
        authorName: q.author_name || "AI Coach Portal",
        datePublished: q.updated_at,
        dateModified: q.updated_at,
      }),
      ...(q.faqs && q.faqs.length ? [buildFaqSchema(q.faqs)] : []),
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Knowledge Hub (AEO/GEO)</h2>
          <p className="text-sm text-muted-foreground">
            AI-generated answer pages optimized for ChatGPT, Perplexity, Claude, and Google Featured Snippets.
          </p>
        </div>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList>
          <TabsTrigger value="questions"><HelpCircle className="h-3.5 w-3.5 mr-1.5" />Questions</TabsTrigger>
          <TabsTrigger value="topics"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Topics</TabsTrigger>
        </TabsList>

        {/* ---------- QUESTIONS TAB ---------- */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">Answer Pages</CardTitle>
              <div className="flex gap-2 items-center">
                <Select value={filterTopicId} onValueChange={setFilterTopicId}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All topics</SelectItem>
                    {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => openQuestion()} disabled={!topics.length}>
                  <Plus className="h-4 w-4 mr-1" /> New Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
                !filteredQuestions.length ? <p className="text-sm text-muted-foreground">No questions yet.</p> :
                <div className="space-y-2">
                  {filteredQuestions.map(q => {
                    const topic = topicById(q.topic_id);
                    return (
                      <div key={q.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground truncate">{q.question}</span>
                            {q.is_published
                              ? <Badge variant="default" className="text-xs">Published</Badge>
                              : <Badge variant="secondary" className="text-xs">Draft</Badge>}
                            {topic && <Badge variant="outline" className="text-xs">{topic.name}</Badge>}
                          </div>
                          {q.ai_summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{q.ai_summary}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            /knowledge/{topic?.slug}/{q.slug} · {q.view_count} views
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => { setPreviewQuestion(q); setPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => openQuestion(q)}><Pencil className="h-4 w-4" /></Button>
                          <Switch checked={q.is_published} onCheckedChange={() => togglePublish(q)} />
                          <Button size="sm" variant="ghost" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- TOPICS TAB ---------- */}
        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Topics</CardTitle>
              <Button onClick={() => openTopic()}><Plus className="h-4 w-4 mr-1" /> New Topic</Button>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
                !topics.length ? <p className="text-sm text-muted-foreground">No topics yet. Create one to start.</p> :
                <div className="space-y-2">
                  {topics.map(t => (
                    <div key={t.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground">{t.name}</span>
                          {t.is_published ? <Badge variant="default" className="text-xs">Live</Badge> : <Badge variant="secondary" className="text-xs">Draft</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">/knowledge/{t.slug}</p>
                        {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openTopic(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteTopic(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------- TOPIC DIALOG ---------------- */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editingTopic.id ? "Edit Topic" : "New Topic"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={editingTopic.name || ""} onChange={e => setEditingTopic({ ...editingTopic, name: e.target.value, slug: editingTopic.slug || slugify(e.target.value) })} /></div>
            <div><Label>Slug</Label><Input value={editingTopic.slug || ""} onChange={e => setEditingTopic({ ...editingTopic, slug: slugify(e.target.value) })} placeholder="auto-generated" /></div>
            <div><Label>Description</Label><Textarea value={editingTopic.description || ""} onChange={e => setEditingTopic({ ...editingTopic, description: e.target.value })} rows={2} /></div>
            <div><Label>Primary Keyword</Label><Input value={editingTopic.primary_keyword || ""} onChange={e => setEditingTopic({ ...editingTopic, primary_keyword: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sort Order</Label><Input type="number" value={editingTopic.sort_order || 0} onChange={e => setEditingTopic({ ...editingTopic, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-end gap-2"><Switch checked={!!editingTopic.is_published} onCheckedChange={v => setEditingTopic({ ...editingTopic, is_published: v })} /><Label>Published</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTopic} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- QUESTION DIALOG ---------------- */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{editingQuestion.id ? "Edit Question" : "New Question"}</span>
              <Button size="sm" onClick={aiGenerate} disabled={generating || !editingQuestion.question}>
                {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                AI Generate
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Topic *</Label>
              <Select value={editingQuestion.topic_id || ""} onValueChange={v => setEditingQuestion({ ...editingQuestion, topic_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Question *</Label><Textarea value={editingQuestion.question || ""} onChange={e => setEditingQuestion({ ...editingQuestion, question: e.target.value })} rows={2} /></div>
            <div><Label>Slug</Label><Input value={editingQuestion.slug || ""} onChange={e => setEditingQuestion({ ...editingQuestion, slug: slugify(e.target.value) })} placeholder="auto-generated" /></div>

            <div className="border-t pt-3">
              <Label className="text-sm font-semibold">AI Summary <span className="text-xs text-muted-foreground">(40-60 words — extracted by ChatGPT/Perplexity)</span></Label>
              <Textarea value={editingQuestion.ai_summary || ""} onChange={e => setEditingQuestion({ ...editingQuestion, ai_summary: e.target.value })} rows={3} />
              <p className="text-xs text-muted-foreground mt-1">{(editingQuestion.ai_summary || "").trim().split(/\s+/).filter(Boolean).length} words</p>
            </div>

            <div><Label>Detailed Explanation (Markdown)</Label><Textarea value={editingQuestion.detailed_explanation || ""} onChange={e => setEditingQuestion({ ...editingQuestion, detailed_explanation: e.target.value })} rows={8} /></div>

            <div>
              <Label>Key Takeaways (one per line)</Label>
              <Textarea
                value={(editingQuestion.key_takeaways || []).join("\n")}
                onChange={e => setEditingQuestion({ ...editingQuestion, key_takeaways: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
                rows={4}
              />
            </div>

            <div>
              <Label>FAQs (Q→A pairs)</Label>
              <div className="space-y-2">
                {(editingQuestion.faqs || []).map((f, i) => (
                  <div key={i} className="border border-border rounded p-2 space-y-1">
                    <Input placeholder="Question" value={f.question} onChange={e => {
                      const next = [...(editingQuestion.faqs || [])]; next[i] = { ...f, question: e.target.value };
                      setEditingQuestion({ ...editingQuestion, faqs: next });
                    }} />
                    <Textarea placeholder="Answer" value={f.answer} rows={2} onChange={e => {
                      const next = [...(editingQuestion.faqs || [])]; next[i] = { ...f, answer: e.target.value };
                      setEditingQuestion({ ...editingQuestion, faqs: next });
                    }} />
                    <Button size="sm" variant="ghost" onClick={() => {
                      const next = [...(editingQuestion.faqs || [])]; next.splice(i, 1);
                      setEditingQuestion({ ...editingQuestion, faqs: next });
                    }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setEditingQuestion({ ...editingQuestion, faqs: [...(editingQuestion.faqs || []), { question: "", answer: "" }] })}>
                  <Plus className="h-3 w-3 mr-1" /> Add FAQ
                </Button>
              </div>
            </div>

            <div className="border-t pt-3 grid grid-cols-2 gap-3">
              <div><Label>Meta Title (≤60)</Label><Input value={editingQuestion.meta_title || ""} onChange={e => setEditingQuestion({ ...editingQuestion, meta_title: e.target.value })} maxLength={70} /></div>
              <div><Label>Focus Keyword</Label><Input value={editingQuestion.focus_keyword || ""} onChange={e => setEditingQuestion({ ...editingQuestion, focus_keyword: e.target.value })} /></div>
              <div className="col-span-2"><Label>Meta Description (≤160)</Label><Textarea value={editingQuestion.meta_description || ""} onChange={e => setEditingQuestion({ ...editingQuestion, meta_description: e.target.value })} rows={2} maxLength={170} /></div>
              <div className="col-span-2">
                <Label>Secondary Keywords (comma-separated)</Label>
                <Input
                  value={(editingQuestion.secondary_keywords || []).join(", ")}
                  onChange={e => setEditingQuestion({ ...editingQuestion, secondary_keywords: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                />
              </div>
            </div>

            <div className="border-t pt-3 grid grid-cols-2 gap-3">
              <div><Label>Author Name (E-E-A-T)</Label><Input value={editingQuestion.author_name || ""} onChange={e => setEditingQuestion({ ...editingQuestion, author_name: e.target.value })} /></div>
              <div><Label>Author Expertise</Label><Input value={editingQuestion.author_expertise || ""} onChange={e => setEditingQuestion({ ...editingQuestion, author_expertise: e.target.value })} /></div>
              <div className="col-span-2"><Label>Reviewed By (optional)</Label><Input value={editingQuestion.reviewed_by || ""} onChange={e => setEditingQuestion({ ...editingQuestion, reviewed_by: e.target.value })} /></div>
            </div>

            <div className="border-t pt-3 flex items-center gap-3">
              <Switch checked={!!editingQuestion.is_published} onCheckedChange={v => setEditingQuestion({ ...editingQuestion, is_published: v })} />
              <Label>Publish (auto-submit to Google + Bing indexing)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveQuestion} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- PREVIEW DIALOG ---------------- */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview & Schema</DialogTitle></DialogHeader>
          {previewQuestion && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">SEO Meta</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-2 font-mono">
                  <div><span className="text-muted-foreground">Title:</span> {previewQuestion.meta_title || previewQuestion.question}</div>
                  <div><span className="text-muted-foreground">Description:</span> {previewQuestion.meta_description || previewQuestion.ai_summary}</div>
                  <div><span className="text-muted-foreground">Canonical:</span> /knowledge/{topicById(previewQuestion.topic_id)?.slug}/{previewQuestion.slug}</div>
                  <div><span className="text-muted-foreground">Focus:</span> {previewQuestion.focus_keyword}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">AI Summary (LLM extraction target)</CardTitle></CardHeader>
                <CardContent><p className="text-sm">{previewQuestion.ai_summary}</p></CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">JSON-LD Schema</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-[10px] bg-muted p-3 rounded overflow-x-auto max-h-72">{JSON.stringify(buildPreviewSchemas(previewQuestion), null, 2)}</pre>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKnowledgeHub;
