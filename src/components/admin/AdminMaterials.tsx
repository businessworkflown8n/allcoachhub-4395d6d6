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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, Download, Mail, Search, Link2, TrendingUp, Copy, Share2, BarChart3, ExternalLink } from "lucide-react";
import AdminMaterialInsights from "./AdminMaterialInsights";

const CATEGORIES = ["General", "AI Research", "AI Tools", "Templates", "Guides", "Worksheets", "Case Studies"];
const FILE_TYPES = ["pdf", "doc", "xls", "image", "video", "link"];
const RESOURCE_TYPES = [
  { value: "file", label: "Uploaded File" },
  { value: "link", label: "External Link" },
  { value: "both", label: "Both (File + Link)" },
];

const SOCIAL_PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", settingKey: "social_linkedin_enabled" },
  { key: "facebook", label: "Facebook", settingKey: "social_facebook_enabled" },
  { key: "instagram", label: "Instagram", settingKey: "social_instagram_enabled" },
  { key: "twitter", label: "X / Twitter", settingKey: "social_twitter_enabled" },
  { key: "youtube", label: "YouTube", settingKey: "social_youtube_enabled" },
  { key: "tiktok", label: "TikTok", settingKey: "social_tiktok_enabled" },
] as const;

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
  copy_link_clicks: number;
  share_count: number;
  created_at: string;
  updated_at: string;
  resource_type: string;
  external_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  linkedin_clicks: number;
  facebook_clicks: number;
  instagram_clicks: number;
  twitter_clicks: number;
  youtube_clicks: number;
  tiktok_clicks: number;
};

type DownloadSourceStats = {
  learner_dashboard: number;
  public_materials: number;
  coach_dashboard: number;
  material_detail: number;
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
  resource_type: "file",
  external_url: "",
  linkedin_url: "",
  facebook_url: "",
  instagram_url: "",
  twitter_url: "",
  youtube_url: "",
  tiktok_url: "",
};

const isValidUrl = (url: string) => {
  if (!url.trim()) return true;
  try { new URL(url); return true; } catch { return false; }
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
  const [sourceStats, setSourceStats] = useState<Record<string, DownloadSourceStats>>({});
  const [showSourceBreakdown, setShowSourceBreakdown] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState<Record<string, boolean>>({
    materials_page_enabled: true,
    materials_download_enabled: true,
    materials_email_share_enabled: true,
    social_media_enabled: false,
    social_linkedin_enabled: true,
    social_facebook_enabled: true,
    social_instagram_enabled: true,
    social_twitter_enabled: true,
    social_youtube_enabled: true,
    social_tiktok_enabled: true,
  });

  const ALL_SETTING_KEYS = [
    "materials_page_enabled", "materials_download_enabled", "materials_email_share_enabled",
    "social_media_enabled",
    ...SOCIAL_PLATFORMS.map((p) => p.settingKey),
  ];

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
      .in("key", ALL_SETTING_KEYS);
    if (data) {
      const s: Record<string, boolean> = { ...globalSettings };
      data.forEach((r: any) => { s[r.key] = r.value === "true"; });
      setGlobalSettings(s);
    }
  };

  const fetchDownloadSources = async () => {
    const { data } = await supabase
      .from("material_downloads")
      .select("material_id, source");
    if (data) {
      const stats: Record<string, DownloadSourceStats> = {};
      data.forEach((d: any) => {
        if (!stats[d.material_id]) stats[d.material_id] = { learner_dashboard: 0, public_materials: 0, coach_dashboard: 0, material_detail: 0 };
        const src = d.source as keyof DownloadSourceStats;
        if (stats[d.material_id][src] !== undefined) stats[d.material_id][src]++;
      });
      setSourceStats(stats);
    }
  };

  useEffect(() => { fetchMaterials(); fetchSettings(); fetchDownloadSources(); }, []);

  const updateGlobalSetting = async (key: string, value: boolean) => {
    setGlobalSettings((prev) => ({ ...prev, [key]: value }));
    const { error } = await supabase
      .from("platform_settings")
      .update({ value: value.toString() })
      .eq("key", key);
    if (error) {
      await supabase.from("platform_settings").insert({ key, value: value.toString() });
    }
    toast.success("Setting updated");
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
      resource_type: m.resource_type || "file",
      external_url: m.external_url || "",
      linkedin_url: m.linkedin_url || "",
      facebook_url: m.facebook_url || "",
      instagram_url: m.instagram_url || "",
      twitter_url: m.twitter_url || "",
      youtube_url: m.youtube_url || "",
      tiktok_url: m.tiktok_url || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }

    // Validate external URL when resource_type requires it
    if ((form.resource_type === "link" || form.resource_type === "both") && form.external_url.trim()) {
      if (!isValidUrl(form.external_url)) {
        toast.error("Invalid external URL format");
        return;
      }
    }
    if (form.resource_type === "link" && !form.external_url.trim()) {
      toast.error("External URL is required for link-type resources");
      return;
    }

    const socialFields = ["linkedin_url", "facebook_url", "instagram_url", "twitter_url", "youtube_url", "tiktok_url"] as const;
    for (const field of socialFields) {
      if (!isValidUrl(form[field])) {
        toast.error(`Invalid URL for ${field.replace("_url", "").replace("_", " ")}`);
        return;
      }
    }

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
      resource_type: form.resource_type,
      external_url: form.external_url.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      twitter_url: form.twitter_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
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

  const copyLink = (m: Material) => {
    // Copy external URL if link-only, otherwise copy public slug link
    const url = m.resource_type === "link" && m.external_url
      ? m.external_url
      : `${window.location.origin}/materials/${m.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const openExternalLink = (url: string | null) => {
    if (url) window.open(url, "_blank");
  };

  const handleAdminDownload = (m: Material) => {
    if (m.file_url) window.open(m.file_url, "_blank");
    else if (m.external_url) window.open(m.external_url, "_blank");
  };

  const handleAdminShare = async (m: Material) => {
    const url = `${window.location.origin}/materials/${m.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: m.title, text: m.description || "", url });
        toast.success("Shared!");
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Public link copied!");
    }
  };

  const getSocialLinkCount = (m: Material) => {
    return [m.linkedin_url, m.facebook_url, m.instagram_url, m.twitter_url, m.youtube_url, m.tiktok_url]
      .filter(Boolean).length;
  };

  const filtered = materials.filter((m) => {
    const matchCat = filterCategory === "All" || m.category === filterCategory;
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalViews = materials.reduce((s, m) => s + m.view_count, 0);
  const totalDownloads = materials.reduce((s, m) => s + m.download_count, 0);
  const totalEmailShares = materials.reduce((s, m) => s + m.email_share_count, 0);
  const totalCopyLinks = materials.reduce((s, m) => s + (m.copy_link_clicks || 0), 0);
  const totalShares = materials.reduce((s, m) => s + (m.share_count || 0), 0);
  const mostViewed = [...materials].sort((a, b) => b.view_count - a.view_count)[0];

  const allSourceStats = Object.values(sourceStats);
  const totalLearnerDl = allSourceStats.reduce((s, v) => s + v.learner_dashboard, 0);
  const totalPublicDl = allSourceStats.reduce((s, v) => s + v.public_materials, 0);
  const totalCoachDl = allSourceStats.reduce((s, v) => s + v.coach_dashboard, 0);
  const totalDetailDl = allSourceStats.reduce((s, v) => s + v.material_detail, 0);

  const resourceTypeLabel = (type: string) => {
    switch (type) {
      case "link": return "Link";
      case "both": return "File + Link";
      default: return "File";
    }
  };

  return (
    <Tabs defaultValue="manage" className="space-y-6">
      <TabsList>
        <TabsTrigger value="manage"><FileText className="h-4 w-4 mr-1.5" /> Manage</TabsTrigger>
        <TabsTrigger value="insights"><BarChart3 className="h-4 w-4 mr-1.5" /> Insights</TabsTrigger>
      </TabsList>
      <TabsContent value="manage">
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
            <div className="flex items-center gap-3">
              <Switch checked={globalSettings.social_media_enabled} onCheckedChange={(v) => updateGlobalSetting("social_media_enabled", v)} />
              <Label>Social Media Buttons</Label>
            </div>
          </div>

          {globalSettings.social_media_enabled && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Enable/disable individual platforms:</p>
              <div className="flex flex-wrap gap-5">
                {SOCIAL_PLATFORMS.map((p) => (
                  <div key={p.key} className="flex items-center gap-2">
                    <Switch
                      checked={globalSettings[p.settingKey] ?? true}
                      onCheckedChange={(v) => updateGlobalSetting(p.settingKey, v)}
                    />
                    <Label className="text-sm">{p.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold text-foreground">{materials.length}</p><p className="text-sm text-muted-foreground">Materials</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Eye className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold text-foreground">{totalViews}</p><p className="text-sm text-muted-foreground">Views</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Download className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold text-foreground">{totalDownloads}</p><p className="text-sm text-muted-foreground">Downloads</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Mail className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold text-foreground">{totalEmailShares}</p><p className="text-sm text-muted-foreground">Email Shares</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Copy className="h-8 w-8 text-purple-500" /><div><p className="text-2xl font-bold text-foreground">{totalCopyLinks}</p><p className="text-sm text-muted-foreground">Link Copies</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Share2 className="h-8 w-8 text-cyan-500" /><div><p className="text-2xl font-bold text-foreground">{totalShares}</p><p className="text-sm text-muted-foreground">Shares</p></div></div></CardContent></Card>
      </div>

      {/* Download Source Breakdown */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Download Sources</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div><span className="text-muted-foreground">Learner Dashboard:</span> <span className="font-medium text-foreground">{totalLearnerDl}</span></div>
            <div><span className="text-muted-foreground">Public Page:</span> <span className="font-medium text-foreground">{totalPublicDl}</span></div>
            <div><span className="text-muted-foreground">Coach Dashboard:</span> <span className="font-medium text-foreground">{totalCoachDl}</span></div>
            <div><span className="text-muted-foreground">Detail Page:</span> <span className="font-medium text-foreground">{totalDetailDl}</span></div>
          </div>
        </CardContent>
      </Card>

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
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No materials found</TableCell></TableRow>
              ) : filtered.map((m) => {
                const mSource = sourceStats[m.id];
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium text-foreground line-clamp-1">{m.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">/materials/{m.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="uppercase text-xs">{m.file_type}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={m.resource_type === "link" ? "default" : m.resource_type === "both" ? "secondary" : "outline"} className="text-xs">
                        {m.resource_type === "link" && <Link2 className="h-3 w-3 mr-1" />}
                        {resourceTypeLabel(m.resource_type || "file")}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant={m.is_published ? "default" : "outline"}>{m.is_published ? "Published" : "Draft"}</Badge></TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" /> {m.view_count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        className="flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline"
                        onClick={() => setShowSourceBreakdown(showSourceBreakdown === m.id ? null : m.id)}
                      >
                        <Download className="h-3.5 w-3.5" /> {m.download_count}
                      </button>
                      {showSourceBreakdown === m.id && mSource && (
                        <div className="mt-1 text-[10px] text-muted-foreground space-y-0.5">
                          <div>Learner: {mSource.learner_dashboard}</div>
                          <div>Public: {mSource.public_materials}</div>
                          <div>Coach: {mSource.coach_dashboard}</div>
                          <div>Detail: {mSource.material_detail}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.email_share_count + (m.copy_link_clicks || 0) + (m.share_count || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {(m.file_url || m.external_url) && (
                          <Button variant="ghost" size="icon" onClick={() => handleAdminDownload(m)} title="Download / Open">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => copyLink(m)} title="Copy link">
                          <Copy className="h-4 w-4" />
                        </Button>
                        {m.external_url && (
                          <Button variant="ghost" size="icon" onClick={() => openExternalLink(m.external_url)} title="Open external link">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleAdminShare(m)} title="Share">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => togglePublish(m)} title={m.is_published ? "Unpublish" : "Publish"}>
                          {m.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            <div className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2">
                <Label>Resource Type</Label>
                <Select value={form.resource_type} onValueChange={(v) => setForm({ ...form, resource_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESOURCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this material..." rows={3} />
            </div>

            {/* File Upload - shown for file or both */}
            {(form.resource_type === "file" || form.resource_type === "both") && (
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
            )}

            {/* Thumbnail only for link type */}
            {form.resource_type === "link" && (
              <div className="space-y-2">
                <Label>Upload Thumbnail</Label>
                <Input type="file" onChange={(e) => handleFileUpload(e, "thumbnail")} disabled={thumbnailUploading} accept="image/*" />
                {thumbnailUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                {form.thumbnail_url && <img src={form.thumbnail_url} alt="Thumb" className="h-16 w-16 rounded object-cover mt-1" />}
              </div>
            )}

            {/* External URL - shown for link or both */}
            {(form.resource_type === "link" || form.resource_type === "both") && (
              <div className="space-y-2">
                <Label>External URL {form.resource_type === "link" ? "*" : ""}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.external_url}
                    onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                    placeholder="https://example.com/resource"
                    className="flex-1"
                  />
                  {form.external_url && isValidUrl(form.external_url) && form.external_url.trim() && (
                    <Button type="button" variant="outline" size="icon" onClick={() => window.open(form.external_url, "_blank")} title="Preview link">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {form.external_url && !isValidUrl(form.external_url) && (
                  <p className="text-xs text-destructive">Invalid URL format</p>
                )}
                {form.external_url && isValidUrl(form.external_url) && form.external_url.trim() && (
                  <div className="rounded-md border border-border p-3 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm">
                      <Link2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-foreground truncate">{form.external_url}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* Social Media Links Section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Social Media Links</Label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">LinkedIn URL</Label>
                  <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Facebook URL</Label>
                  <Input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Instagram URL</Label>
                  <Input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">X / Twitter URL</Label>
                  <Input value={form.twitter_url} onChange={(e) => setForm({ ...form, twitter_url: e.target.value })} placeholder="https://x.com/..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">YouTube URL</Label>
                  <Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">TikTok URL</Label>
                  <Input value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} placeholder="https://tiktok.com/..." />
                </div>
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
      </TabsContent>
      <TabsContent value="insights">
        <AdminMaterialInsights />
      </TabsContent>
    </Tabs>
  );
};

export default AdminMaterials;
