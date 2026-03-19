import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SEOTemplate {
  id: string;
  name: string;
  page_type: string;
  meta_title_template: string;
  meta_description_template: string;
  h1_template: string | null;
  default_schema_type: string | null;
  is_active: boolean;
}

const SEOTemplateEngine = () => {
  const [templates, setTemplates] = useState<SEOTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    page_type: "course",
    meta_title_template: "",
    meta_description_template: "",
    h1_template: "",
    default_schema_type: "Course",
  });

  const loadTemplates = async () => {
    const { data } = await supabase.from("seo_templates").select("*").order("created_at", { ascending: false });
    setTemplates((data || []) as SEOTemplate[]);
    setLoading(false);
  };

  useEffect(() => { loadTemplates(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.meta_title_template || !form.meta_description_template) {
      toast({ title: "Missing Fields", description: "Name, title template, and description template are required.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("seo_templates").insert({
      name: form.name,
      page_type: form.page_type,
      meta_title_template: form.meta_title_template,
      meta_description_template: form.meta_description_template,
      h1_template: form.h1_template || null,
      default_schema_type: form.default_schema_type || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template Created" });
      setShowCreate(false);
      setForm({ name: "", page_type: "course", meta_title_template: "", meta_description_template: "", h1_template: "", default_schema_type: "Course" });
      loadTemplates();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("seo_templates").delete().eq("id", id);
    toast({ title: "Template Deleted" });
    loadTemplates();
  };

  const handleApplyTemplate = async (template: SEOTemplate) => {
    setApplying(template.id);
    // Get all pages of matching type that are auto-generated (haven't been manually edited)
    const { data: pages } = await supabase
      .from("seo_page_metadata")
      .select("id, page_url, h1_tag")
      .eq("page_type", template.page_type)
      .eq("is_auto_generated", true);

    if (!pages || pages.length === 0) {
      toast({ title: "No Pages", description: `No auto-generated ${template.page_type} pages to update.` });
      setApplying(null);
      return;
    }

    let updated = 0;
    for (const page of pages) {
      const pageName = page.h1_tag || page.page_url.split("/").pop()?.replace(/-/g, " ") || "Page";
      const title = template.meta_title_template.replace(/\{[^}]+\}/g, pageName);
      const desc = template.meta_description_template.replace(/\{[^}]+\}/g, pageName);
      const h1 = template.h1_template ? template.h1_template.replace(/\{[^}]+\}/g, pageName) : page.h1_tag;

      await supabase.from("seo_page_metadata").update({
        meta_title: title,
        meta_description: desc,
        h1_tag: h1,
        updated_at: new Date().toISOString(),
      }).eq("id", page.id);
      updated++;
    }

    toast({ title: "Template Applied", description: `Updated ${updated} ${template.page_type} pages.` });
    setApplying(null);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">SEO Templates</h3>
          <p className="text-sm text-muted-foreground">Create templates to auto-apply SEO metadata to pages by type.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Create Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create SEO Template</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Course SEO Template" />
              </div>
              <div>
                <Label>Page Type</Label>
                <Select value={form.page_type} onValueChange={v => setForm(f => ({ ...f, page_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="landing">Landing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Meta Title Template</Label>
                <Input value={form.meta_title_template} onChange={e => setForm(f => ({ ...f, meta_title_template: e.target.value }))} placeholder="Learn {Course Name} | AI Coach Portal" />
                <p className="mt-1 text-xs text-muted-foreground">Use {"{placeholder}"} for dynamic values</p>
              </div>
              <div>
                <Label>Meta Description Template</Label>
                <Input value={form.meta_description_template} onChange={e => setForm(f => ({ ...f, meta_description_template: e.target.value }))} placeholder="Join {Course Name} with expert coaching. Enroll today." />
              </div>
              <div>
                <Label>H1 Template (optional)</Label>
                <Input value={form.h1_template} onChange={e => setForm(f => ({ ...f, h1_template: e.target.value }))} placeholder="{Course Name} Course" />
              </div>
              <div>
                <Label>Default Schema Type</Label>
                <Input value={form.default_schema_type} onChange={e => setForm(f => ({ ...f, default_schema_type: e.target.value }))} placeholder="Course" />
              </div>
              <Button onClick={handleCreate} className="w-full">Create Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default templates info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Default Templates</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded border border-border p-3">
            <p className="font-medium text-foreground">Course Pages</p>
            <p className="text-muted-foreground">Title: Learn {"{Course Name}"} | AI Coach Portal</p>
            <p className="text-muted-foreground">Desc: Join {"{Course Name}"} by expert coaches. Enroll today.</p>
          </div>
          <div className="rounded border border-border p-3">
            <p className="font-medium text-foreground">Coach Pages</p>
            <p className="text-muted-foreground">Title: {"{Coach Name}"} – AI Coach | AI Coach Portal</p>
            <p className="text-muted-foreground">Desc: Learn from {"{Coach Name}"}, expert AI coach.</p>
          </div>
          <div className="rounded border border-border p-3">
            <p className="font-medium text-foreground">Blog Posts</p>
            <p className="text-muted-foreground">Title: {"{Blog Title}"} | AI Coach Portal</p>
            <p className="text-muted-foreground">Desc: Auto-generated from excerpt.</p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Custom Templates</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Page Type</TableHead>
                  <TableHead>Title Pattern</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{t.page_type}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{t.meta_title_template}</TableCell>
                    <TableCell>{t.is_active ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleApplyTemplate(t)} disabled={applying === t.id}>
                          {applying === t.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                          Apply
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SEOTemplateEngine;
