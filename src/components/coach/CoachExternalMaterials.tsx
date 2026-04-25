import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ExternalLink, Pencil, Trash2, Link as LinkIcon } from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string | null;
  external_link: string;
  category: string | null;
  status: string;
  created_at: string;
}

const materialSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  external_link: z
    .string()
    .trim()
    .min(1, "External link is required")
    .max(2048)
    .regex(/^https:\/\//i, "Enter a valid HTTPS URL")
    .url("Enter a valid HTTPS URL"),
  category: z.string().trim().max(100).optional().or(z.literal("")),
});

const emptyForm = { title: "", description: "", external_link: "", category: "" };

const CoachExternalMaterials = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("coach_materials")
      .select("id,title,description,external_link,category,status,created_at")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load materials");
    setItems((data as Material[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (m: Material) => {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description || "",
      external_link: m.external_link,
      category: m.category || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    const parsed = materialSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }
    setSaving(true);
    const payload = {
      coach_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      external_link: parsed.data.external_link,
      category: parsed.data.category || null,
    };
    if (editing) {
      const { error } = await supabase.from("coach_materials").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); setSaving(false); return; }
      toast.success("Material updated successfully");
    } else {
      const { error } = await supabase.from("coach_materials").insert(payload);
      if (error) { toast.error("Failed to add material"); setSaving(false); return; }
      toast.success("Material added successfully");
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    const { error } = await supabase.from("coach_materials").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Material deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            Materials (External Links)
          </h2>
          <p className="text-sm text-muted-foreground">Share external resource links with your enrolled learners.</p>
        </div>
        <Button onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" />Add Material</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LinkIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">No materials added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add Material" to share an external link with your learners.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base text-foreground line-clamp-2">{m.title}</CardTitle>
                  {m.category && <Badge variant="secondary">{m.category}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {m.description && <p className="text-sm text-muted-foreground line-clamp-3">{m.description}</p>}
                <a
                  href={m.external_link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-sm text-primary hover:underline flex items-center gap-1 break-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{m.external_link}</span>
                </a>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)} className="gap-1"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(m.id)} className="gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Material" : "Add Material"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} placeholder="e.g. AI Prompt Engineering Guide" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} rows={3} placeholder="Optional description" />
            </div>
            <div className="space-y-1.5">
              <Label>External Link (HTTPS only) <span className="text-destructive">*</span></Label>
              <Input
                type="url"
                value={form.external_link}
                onChange={(e) => setForm({ ...form, external_link: e.target.value })}
                placeholder="https://example.com/resource"
                maxLength={2048}
              />
              <p className="text-xs text-muted-foreground">Only HTTPS URLs are allowed. No file uploads.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} maxLength={100} placeholder="Optional (e.g. Templates, Guides)" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachExternalMaterials;
