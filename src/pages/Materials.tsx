import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Lock, Search, Copy, Share2, TrendingUp, Flame, ExternalLink, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEngagementMultiplier } from "@/hooks/useEngagementMultiplier";
import MaterialFormDialog from "@/components/materials/MaterialFormDialog";

const CATEGORIES = ["All", "General", "AI Research", "AI Tools", "Templates", "Guides", "Worksheets", "Case Studies"];

const VIEW_COOLDOWN_MS = 10_000;

const Materials = () => {
  useSEO({
    title: "Learning Materials – AI Coach Portal",
    description: "Access curated AI learning materials, templates, guides, and research documents.",
    canonical: "https://www.aicoachportal.com/materials",
  });

  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { displayViews, displayDownloads, isTrending, isPopular } = useEngagementMultiplier();
  const { role, isAdmin, isCoach } = useUserRole();
  const canManage = isAdmin || isCoach;
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [pageEnabled, setPageEnabled] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const viewTrackedRef = useRef<Record<string, number>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);

  useEffect(() => {
    const checkPageEnabled = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "materials_page_enabled")
        .single();
      if (data) setPageEnabled(data.value === "true");
    };
    checkPageEnabled();
  }, []);

  const fetchMaterials = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("materials")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (data) setMaterials(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material permanently?")) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Material deleted");
    fetchMaterials();
  };

  const openEdit = (m: any) => {
    setEditingMaterial(m);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingMaterial(null);
    setFormOpen(true);
  };

  const filtered = materials.filter((m) => {
    const matchCat = filterCategory === "All" || m.category === filterCategory;
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const fileIcon = (type: string) => {
    switch (type) {
      case "pdf": return "📄";
      case "doc": return "📝";
      case "xls": return "📊";
      case "image": return "🖼️";
      case "video": return "🎬";
      case "link": return "🔗";
      default: return "📁";
    }
  };

  const trackView = useCallback(async (material: any) => {
    const now = Date.now();
    const lastViewed = viewTrackedRef.current[material.id] || 0;
    if (now - lastViewed > VIEW_COOLDOWN_MS) {
      viewTrackedRef.current[material.id] = now;
      await supabase.from("materials").update({ view_count: (material.view_count || 0) + 1 }).eq("id", material.id);
      setMaterials((prev) => prev.map((m) => m.id === material.id ? { ...m, view_count: (m.view_count || 0) + 1 } : m));
    }
  }, []);

  const handleDownload = useCallback(async (material: any) => {
    const fileUrl = material.file_url || material.external_url;
    if (!fileUrl || downloadingId === material.id) return;
    setDownloadingId(material.id);
    try {
      await supabase.from("material_downloads").insert({
        material_id: material.id,
        user_id: user?.id || null,
        source: "public_materials",
      });
      await supabase.from("materials").update({ download_count: (material.download_count || 0) + 1 }).eq("id", material.id);
      setMaterials((prev) => prev.map((m) => m.id === material.id ? { ...m, download_count: (m.download_count || 0) + 1 } : m));
      window.open(fileUrl, "_blank");
    } finally {
      setTimeout(() => setDownloadingId(null), 2000);
    }
  }, [downloadingId, user]);

  const handleCopyLink = async (material: any) => {
    const url = material.resource_type === "link" && material.external_url
      ? material.external_url
      : `${window.location.origin}/materials/${material.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied successfully!");
      await supabase.from("materials").update({ copy_link_clicks: (material.copy_link_clicks || 0) + 1 }).eq("id", material.id);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async (material: any) => {
    const url = `${window.location.origin}/materials/${material.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: material.title, text: material.description || "", url });
        toast.success("Material link shared successfully!");
        await supabase.from("materials").update({ share_count: (material.share_count || 0) + 1 }).eq("id", material.id);
      } catch { /* cancelled */ }
    } else {
      handleCopyLink(material);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {!pageEnabled ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Materials Currently Unavailable</h1>
            <p className="text-muted-foreground">This section is temporarily disabled. Please check back later.</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Login Required</h1>
            <p className="text-muted-foreground mb-6">Please login to access AI learning materials.</p>
            <div className="flex gap-3">
              <Link to={`/auth?mode=login&redirect=${encodeURIComponent(location.pathname)}`} className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">Sign In</Link>
              <Link to={`/auth?mode=signup&redirect=${encodeURIComponent(location.pathname)}`} className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-accent">Sign Up</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Learning Materials</h1>
                <p className="text-muted-foreground">Browse and download curated AI learning resources</p>
              </div>
              {canManage && (
                <Button onClick={openCreate} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Material
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input placeholder="Search materials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No materials found</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((m) => {
                  const isLinkOnly = m.resource_type === "link" && !m.file_url;
                  const hasFile = !!m.file_url;
                  const hasExtUrl = !!m.external_url;

                  return (
                    <Card key={m.id} className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                      {m.thumbnail_url && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                          <img src={m.thumbnail_url} alt={m.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <CardContent className={`${m.thumbnail_url ? "pt-4" : "pt-6"} space-y-3`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-2xl">{fileIcon(m.file_type)}</span>
                          <Badge variant="secondary" className="shrink-0">{m.category}</Badge>
                        </div>
                        <Link to={`/materials/${m.slug}`} className="block" onClick={() => trackView(m)}>
                          <h3 className="font-semibold text-foreground line-clamp-2 mb-1 hover:text-primary transition-colors">{m.title}</h3>
                        </Link>
                        {m.description && <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {displayViews(m.view_count)}</span>
                          <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {displayDownloads(m.download_count)}</span>
                          <Badge variant="outline" className="uppercase text-[10px]">{m.file_type}</Badge>
                          {isTrending(m.view_count) && <Badge variant="secondary" className="text-[10px] gap-0.5"><TrendingUp className="h-2.5 w-2.5" /> Trending</Badge>}
                          {isPopular(m.download_count) && <Badge variant="default" className="text-[10px] gap-0.5"><Flame className="h-2.5 w-2.5" /> Popular</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {/* File download */}
                          {m.is_downloadable && hasFile && (
                            <Button size="sm" variant="default" onClick={() => handleDownload(m)} disabled={downloadingId === m.id}>
                              <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                            </Button>
                          )}
                          {/* Open Resource for link-only or both */}
                          {hasExtUrl && isLinkOnly && m.is_downloadable && (
                            <Button size="sm" variant="default" onClick={() => handleDownload(m)} disabled={downloadingId === m.id}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Resource
                            </Button>
                          )}
                          {hasExtUrl && !isLinkOnly && (
                            <Button size="sm" variant="outline" onClick={() => window.open(m.external_url, "_blank")}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Link
                            </Button>
                          )}
                          {hasExtUrl && isLinkOnly && !m.is_downloadable && (
                            <Button size="sm" variant="outline" onClick={() => window.open(m.external_url, "_blank")}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Resource
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleCopyLink(m)}>
                            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleNativeShare(m)}>
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                          {canManage && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openEdit(m)} title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)} title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Materials;
