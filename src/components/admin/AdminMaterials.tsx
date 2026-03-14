import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, Download, Mail, Search, Link2, TrendingUp, Copy } from "lucide-react";

const CATEGORIES = ["General", "AI Research", "AI Tools", "Templates", "Guides", "Worksheets", "Case Studies"];
const FILE_TYPES = ["pdf", "doc", "xls", "image", "video"];

type Material = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  file_url: string | null;
  file_type: string;
  is_published: boolean;
  is_downloadable: boolean;
  is_email_shareable: boolean;
  view_count: number;
  download_count: number;
  email_share_count: number;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  category: "General",
  thumbnail_url: "",
  file_url: "",
  file_type: "pdf",
  is_published: true,
  is_downloadable: true,
  is_email_shareable: true,
};

const AdminMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    materials_page_enabled: true,
    materials_download_enabled: true,
    materials_email_share_enabled: true,
  });

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setMaterials(data as unknown as Material[]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["materials_page_enabled", "materials_download_enabled", "materials_email_share_enabled"]);
    if (data) {
      const s: any = { ...globalSettings };
      data.forEach((r: any) => { s[r.key] = r.value === "true"; });
      setGlobalSettings(s);
    }
  };

  useEffect(() => { fetchMaterials(); fetchSettings(); }, []);

  const updateGlobalSetting = async (key: string, value: boolean) => {
    setGlobalSettings((prev: any) => ({ ...prev, [key]: value }));
    const { error } = await supabase
      .from("platform_settings")
      .update({ value: value.toString() })
      .eq("key", key);
    if (error) toast.error("Failed to update setting");
    else toast.success("Setting updated");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "thumbnail") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setter = type === "file" ? setUploading : setThumbnailUploading;
    setter(true);
    const ext = file.name.split(".").pop();
    const path = `${type}s/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("materials").upload(path, file);
    if (error) { toast.error("Upload failed"); setter(false); return; }
    const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
    if (type === "file") {
      setForm((prev) => ({ ...prev, file_url: urlData.publicUrl }));
    } else {
      setForm((prev) => ({ ...prev, thumbnail_url: urlData.publicUrl }));
    }
    setter(false);
    toast.success("Uploaded successfully");
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (m: Material) => {
    setEditing(m.id);
    setForm({
      title: m.title,
      slug: m.slug || "",
      description: m.description || "",
      category: m.category,
      thumbnail_url: m.thumbnail_url || "",
      file_url: m.file_url || "",
      file_type: m.file_type || "pdf",
      is_published: m.is_published,
      is_downloadable: m.is_downloadable,
      is_email_shareable: m.is_email_shareable,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload: any = {
      title: form.title.trim(),
      description: form.description || null,
      category: form.category,
      thumbnail_url: form.thumbnail_url || null,
      file_url: form.file_url || null,
      file_type: form.file_type,
      is_published: form.is_published,
      is_downloadable: form.is_downloadable,
      is_email_shareable: form.is_email_shareable,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();

    if (editing) {
      const { error } = await supabase.from("materials").update(payload).eq("id", editing);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Material updated");
    } else {
      const { error } = await supabase.from("materials").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Material created");
    }
    setDialogOpen(false);
    fetchMaterials();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material permanently?")) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Material deleted");
    fetchMaterials();
  };

  const togglePublish = async (m: Material) => {
    const { error } = await supabase.from("materials").update({ is_published: !m.is_published }).eq("id", m.id);
    if (!error) { toast.success(m.is_published ? "Unpublished" : "Published"); fetchMaterials(); }
  };

  const copyLink = (slug: string | null) => {
    if (!slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/materials/${slug}`);
    toast.success("Link copied!");
  };

  const filtered = materials.filter((m) => {
    const matchCat = filterCategory === "All" || m.category === filterCategory;
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalViews = materials.reduce((s, m) => s + m.view_count, 0);
  const totalDownloads = materials.reduce((s, m) => s + m.download_count, 0);
  const totalShares = materials.reduce((s, m) => s + m.email_share_count, 0);
  const mostViewed = [...materials].sort((a, b) => b.view_count - a.view_count)[0];

  return (
    <div className="space-y-6">
      {/* Global Toggles */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Global Controls</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch checked={globalSettings.materials_page_enabled} onCheckedChange={(v) => updateGlobalSetting("materials_page_enabled", v)} />
              <Label>Materials Page</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={globalSettings.materials_download_enabled} onCheckedChange={(v) => updateGlobalSetting("materials_download_enabled", v)} />
              <Label>Downloads</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={globalSettings.materials_email_share_enabled} onCheckedChange={(v) => updateGlobalSetting("materials_email_share_enabled", v)} />
              <Label>Email Sharing</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold text-foreground">{materials.length}</p><p className="text-sm text-muted-foreground">Total Materials</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Eye className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold text-foreground">{totalViews}</p><p className="text-sm text-muted-foreground">Total Views</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Download className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold text-foreground">{totalDownloads}</p><p className="text-sm text-muted-foreground">Total Downloads</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Mail className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold text-foreground">{totalShares}</p><p className="text-sm text-muted-foreground">Email Shares</p></div></div></CardContent></Card>
      </div>

      {mostViewed && (
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">Most Viewed:</span><span className="font-medium text-foreground">{mostViewed.title}</span><Badge variant="secondary">{mostViewed.view_count} views</Badge></div></CardContent></Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search materials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Material</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No materials found</TableCell></TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="max-w-[250px]">
                      <p className="font-medium text-foreground line-clamp-1">{m.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">/materials/{m.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="uppercase text-xs">{m.file_type}</Badge></TableCell>
                  <TableCell><Badge variant={m.is_published ? "default" : "outline"}>{m.is_published ? "Published" : "Draft"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.view_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.download_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyLink(m.slug)} title="Copy link"><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => togglePublish(m)} title={m.is_published ? "Unpublish" : "Publish"}>{m.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Material" : "Add New Material"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Material title" />
              </div>
              <div className="space-y-2">
                <Label>Slug / URL</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generated if empty" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={form.file_type} onValueChange={(v) => setForm({ ...form, file_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FILE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this material..." rows={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Upload File</Label>
                <Input type="file" onChange={(e) => handleFileUpload(e, "file")} disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.mp4,.webm" />
                {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                {form.file_url && <p className="text-xs text-primary truncate">{form.file_url}</p>}
              </div>
              <div className="space-y-2">
                <Label>Upload Thumbnail</Label>
                <Input type="file" onChange={(e) => handleFileUpload(e, "thumbnail")} disabled={thumbnailUploading} accept="image/*" />
                {thumbnailUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                {form.thumbnail_url && <img src={form.thumbnail_url} alt="Thumb" className="h-16 w-16 rounded object-cover mt-1" />}
              </div>
            </div>
            <div className="flex flex-wrap gap-6 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label>Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_downloadable} onCheckedChange={(v) => setForm({ ...form, is_downloadable: v })} />
                <Label>Downloadable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_email_shareable} onCheckedChange={(v) => setForm({ ...form, is_email_shareable: v })} />
                <Label>Email Shareable</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMaterials;
