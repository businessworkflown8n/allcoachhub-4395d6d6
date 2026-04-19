import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachFeatures } from "@/hooks/useCoachFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ExternalLink, Pencil, Trash2, Eye, FileText, Lock } from "lucide-react";

const CATEGORIES = ["General", "AI Research", "AI Tools", "Templates", "Guides", "Worksheets", "Case Studies"];

interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  category: string;
  tags: string[] | null;
  audience_scope: "coach_all_learners" | "coach_course_learners";
  audience_course_id: string | null;
  is_published: boolean;
  view_count: number;
  copy_link_clicks: number;
  created_at: string;
}

const emptyForm = {
  title: "",
  description: "",
  external_url: "",
  thumbnail_url: "",
  category: "General",
  tags: "",
  audience_scope: "coach_all_learners" as "coach_all_learners" | "coach_course_learners",
  audience_course_id: "" as string,
  is_published: true,
};

const CoachMaterials = () => {
  const { user } = useAuth();
  const features = useCoachFeatures();
  const hasAccess = (features as any).materials_access !== false;
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: mats }, { data: crs }] = await Promise.all([
      supabase.from("materials").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title").eq("coach_id", user.id).order("created_at", { ascending: false }),
    ]);
    setMaterials((mats as any[]) || []);
    setCourses((crs as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (m: MaterialRow) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description || "",
      external_url: m.external_url || "",
      thumbnail_url: m.thumbnail_url || "",
      category: m.category,
      tags: (m.tags || []).join(", "),
      audience_scope: m.audience_scope,
      audience_course_id: m.audience_course_id || "",
      is_published: m.is_published,
    });
    setOpen(true);
  };

  const validateUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch { return false; }
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.external_url.trim() || !validateUrl(form.external_url.trim())) {
      toast.error("A valid external URL (https://...) is required");
      return;
    }
    if (form.audience_scope === "coach_course_learners" && !form.audience_course_id) {
      toast.error("Please select a course"); return;
    }
    setSaving(true);
    const payload: any = {
      coach_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      external_url: form.external_url.trim(),
      file_url: form.external_url.trim(), // mirror so existing readers work
      file_type: "link",
      resource_type: "external_link",
      thumbnail_url: form.thumbnail_url.trim() || null,
      category: form.category,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      audience_scope: form.audience_scope,
      audience_course_id: form.audience_scope === "coach_course_learners" ? form.audience_course_id : null,
      is_published: form.is_published,
      is_downloadable: false,
      is_email_shareable: true,
    };
    const { error } = editingId
      ? await supabase.from("materials").update(payload).eq("id", editingId)
      : await supabase.from("materials").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Material updated" : "Material added");
    setOpen(false);
    load();
  };

  const togglePublish = async (m: MaterialRow) => {
    const { error } = await supabase.from("materials").update({ is_published: !m.is_published }).eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    setMaterials((prev) => prev.map((x) => x.id === m.id ? { ...x, is_published: !x.is_published } : x));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setMaterials((prev) => prev.filter((x) => x.id !== id));
    toast.success("Deleted");
  };

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-foreground font-medium">Materials access is not enabled for your account.</p>
          <p className="text-sm text-muted-foreground">Please contact the platform admin to enable this feature.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Materials</h2>
          <p className="text-sm text-muted-foreground">Share external resources with your enrolled learners.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Material</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base text-foreground">All Materials</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-6 text-center">Loading...</p>
          ) : materials.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No materials yet. Add your first external link.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {materials.map((m) => (
                <Card key={m.id} className="border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{m.title}</p>
                        {m.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>}
                      </div>
                      <Badge variant={m.is_published ? "default" : "secondary"} className="shrink-0">
                        {m.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <Badge variant="outline">{m.category}</Badge>
                      <Badge variant="outline">
                        {m.audience_scope === "coach_all_learners" ? "All my learners" : "Specific course"}
                      </Badge>
                      <span className="text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />{m.view_count}</span>
                    </div>
                    {m.external_url && (
                      <a href={m.external_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                        <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{m.external_url}</span>
                      </a>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Switch checked={m.is_published} onCheckedChange={() => togglePublish(m)} />
                      <span className="text-xs text-muted-foreground mr-auto">Publish</span>
                      <Button size="sm" variant="outline" onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => remove(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Material" : "Add External Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AI Productivity Toolkit" />
            </div>
            <div className="space-y-1.5">
              <Label>External URL *</Label>
              <Input type="url" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://example.com/resource" />
              <p className="text-xs text-muted-foreground">Coaches can only share external links (not file uploads).</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tags (comma separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ai, productivity" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Thumbnail URL (optional)</Label>
              <Input type="url" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Audience *</Label>
              <Select value={form.audience_scope} onValueChange={(v: any) => setForm({ ...form, audience_scope: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach_all_learners">All my enrolled learners</SelectItem>
                  <SelectItem value="coach_course_learners">Learners in a specific course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.audience_scope === "coach_course_learners" && (
              <div className="space-y-1.5">
                <Label>Course *</Label>
                <Select value={form.audience_course_id} onValueChange={(v) => setForm({ ...form, audience_course_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>
                    {courses.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No courses yet</div>
                    ) : courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label className="cursor-pointer">Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachMaterials;
