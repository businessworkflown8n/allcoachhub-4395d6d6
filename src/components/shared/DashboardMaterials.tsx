import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Mail, Eye, Search, FileText } from "lucide-react";

const CATEGORIES = ["All", "General", "AI Research", "AI Tools", "Templates", "Guides", "Worksheets", "Case Studies"];

const fileIcon = (type: string) => {
  switch (type) {
    case "pdf": return "📄";
    case "doc": return "📝";
    case "xls": return "📊";
    case "image": return "🖼️";
    case "video": return "🎬";
    default: return "📁";
  }
};

const DashboardMaterials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [settings, setSettings] = useState({ download: true, share: true });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["materials_download_enabled", "materials_email_share_enabled"]);
      if (data) {
        const s: any = { download: true, share: true };
        data.forEach((r: any) => {
          if (r.key === "materials_download_enabled") s.download = r.value === "true";
          if (r.key === "materials_email_share_enabled") s.share = r.value === "true";
        });
        setSettings(s);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchMaterials = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("materials")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (data) setMaterials(data);
      setLoading(false);
    };
    fetchMaterials();
  }, [user]);

  const filtered = materials.filter((m) => {
    const matchCat = filterCategory === "All" || m.category === filterCategory;
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDownload = async (material: any) => {
    if (!material?.file_url) return;
    await supabase.from("materials").update({ download_count: (material.download_count || 0) + 1 }).eq("id", material.id);
    setMaterials((prev) => prev.map((m) => m.id === material.id ? { ...m, download_count: (m.download_count || 0) + 1 } : m));
    window.open(material.file_url, "_blank");
  };

  const openShareDialog = (material: any) => {
    setSelectedMaterial(material);
    setRecipientEmail("");
    setShareOpen(true);
  };

  const handleEmailShare = async () => {
    if (!recipientEmail.trim() || !selectedMaterial) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-material-email", {
        body: {
          recipientEmail: recipientEmail.trim(),
          materialTitle: selectedMaterial.title,
          materialDescription: selectedMaterial.description || "",
          materialLink: `${window.location.origin}/materials/${selectedMaterial.slug}`,
          senderName: user?.user_metadata?.full_name || user?.email || "A user",
        },
      });
      if (error) throw error;
      await supabase.from("materials").update({ email_share_count: (selectedMaterial.email_share_count || 0) + 1 }).eq("id", selectedMaterial.id);
      setMaterials((prev) => prev.map((m) => m.id === selectedMaterial.id ? { ...m, email_share_count: (m.email_share_count || 0) + 1 } : m));
      toast.success("Email sent successfully!");
      setShareOpen(false);
    } catch {
      toast.error("Failed to send email");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Materials Library</h2>
        <p className="text-sm text-muted-foreground">Browse and download curated AI learning resources</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No materials found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
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

                <div>
                  <Link to={`/materials/${m.slug}`} className="font-semibold text-foreground hover:text-primary line-clamp-2 transition-colors">
                    {m.title}
                  </Link>
                  {m.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{m.description}</p>}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {m.view_count}</span>
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {m.download_count}</span>
                  <Badge variant="outline" className="uppercase text-[10px]">{m.file_type}</Badge>
                </div>

                <div className="flex gap-2 pt-1">
                  {settings.download && m.is_downloadable && m.file_url && (
                    <Button size="sm" variant="default" className="flex-1" onClick={() => handleDownload(m)}>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                    </Button>
                  )}
                  {settings.share && m.is_email_shareable && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openShareDialog(m)}>
                      <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Email Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share "{selectedMaterial?.title}" via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Recipient Email</label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareOpen(false)}>Cancel</Button>
              <Button onClick={handleEmailShare} disabled={sending || !recipientEmail.trim()}>
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardMaterials;
