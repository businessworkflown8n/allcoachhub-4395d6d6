import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Mail, ArrowLeft, Eye, Lock, Copy, Share2, TrendingUp, Flame, ExternalLink } from "lucide-react";
import MaterialSocialButtons from "@/components/MaterialSocialButtons";
import { useEngagementMultiplier } from "@/hooks/useEngagementMultiplier";

const VIEW_COOLDOWN_MS = 10_000; // 10 second cooldown per material per session

const MaterialDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { displayViews, displayDownloads, isTrending, isPopular } = useEngagementMultiplier();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const viewTrackedRef = useRef<Record<string, number>>({});
  const [settings, setSettings] = useState<Record<string, boolean>>({
    download: true,
    share: true,
    social_media_enabled: false,
    social_linkedin_enabled: true,
    social_facebook_enabled: true,
    social_instagram_enabled: true,
    social_twitter_enabled: true,
    social_youtube_enabled: true,
    social_tiktok_enabled: true,
  });

  useSEO({
    title: material ? `${material.title} – AI Coach Portal` : "Material – AI Coach Portal",
    description: material?.description || "Learning material from AI Coach Portal",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", [
          "materials_download_enabled", "materials_email_share_enabled",
          "social_media_enabled",
          "social_linkedin_enabled", "social_facebook_enabled", "social_instagram_enabled",
          "social_twitter_enabled", "social_youtube_enabled", "social_tiktok_enabled",
        ]);
      if (data) {
        const s: Record<string, boolean> = { ...settings };
        data.forEach((r: any) => {
          if (r.key === "materials_download_enabled") s.download = r.value === "true";
          else if (r.key === "materials_email_share_enabled") s.share = r.value === "true";
          else s[r.key] = r.value === "true";
        });
        setSettings(s);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!user || !slug) return;
    const fetchMaterial = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("materials")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (data) {
        setMaterial(data);
        // Debounced view tracking - only count once per material per cooldown period
        const now = Date.now();
        const lastViewed = viewTrackedRef.current[data.id] || 0;
        if (now - lastViewed > VIEW_COOLDOWN_MS) {
          viewTrackedRef.current[data.id] = now;
          await supabase.from("materials").update({ view_count: (data.view_count || 0) + 1 }).eq("id", data.id);
          setMaterial((prev: any) => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
        }
      }
      setLoading(false);
    };
    fetchMaterial();
  }, [user, slug]);

  const handleDownload = useCallback(async () => {
    if (!material || downloading) return;
    const fileUrl = material.file_url || material.external_url;
    if (!fileUrl) return;
    setDownloading(true);
    try {
      await supabase.from("material_downloads").insert({
        material_id: material.id,
        user_id: user?.id || null,
        source: "material_detail",
      });
      await supabase.from("materials").update({ download_count: (material.download_count || 0) + 1 }).eq("id", material.id);
      setMaterial((prev: any) => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
      window.open(fileUrl, "_blank");
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  }, [material, downloading, user]);

  const handleCopyLink = async () => {
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

  const handleNativeShare = async () => {
    const url = `${window.location.origin}/materials/${material.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: material.title, text: material.description || "", url });
        toast.success("Material link shared successfully!");
        await supabase.from("materials").update({ share_count: (material.share_count || 0) + 1 }).eq("id", material.id);
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailShare = async () => {
    if (!recipientEmail.trim() || !material) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-material-email", {
        body: {
          recipientEmail: recipientEmail.trim(),
          materialTitle: material.title,
          materialDescription: material.description || "",
          materialLink: `${window.location.origin}/materials/${material.slug}`,
          senderName: user?.user_metadata?.full_name || user?.email || "A user",
        },
      });
      if (error) throw error;
      await supabase.from("materials").update({ email_share_count: (material.email_share_count || 0) + 1 }).eq("id", material.id);
      setMaterial((prev: any) => ({ ...prev, email_share_count: (prev.email_share_count || 0) + 1 }));
      toast.success("Email sent successfully!");
      setShareOpen(false);
      setRecipientEmail("");
    } catch {
      toast.error("Failed to send email");
    }
    setSending(false);
  };

  const isLinkOnly = material?.resource_type === "link" && !material?.file_url;
  const hasExternalUrl = !!material?.external_url;
  const hasFileUrl = !!material?.file_url;

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!authLoading && !user) {
    const redirectUrl = `/materials/${slug}`;
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Login Required</h1>
            <p className="text-muted-foreground mb-6">Please login to access AI learning materials.</p>
            <div className="flex gap-3">
              <Link to={`/auth?mode=login&redirect=${encodeURIComponent(redirectUrl)}`} className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">Sign In</Link>
              <Link to={`/auth?mode=signup&redirect=${encodeURIComponent(redirectUrl)}`} className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-accent">Sign Up</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <Link to="/materials" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Materials
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : !material ? (
          <div className="text-center py-20 text-muted-foreground">Material not found</div>
        ) : (
          <Card>
            {material.thumbnail_url && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img src={material.thumbnail_url} alt={material.title} className="h-full w-full object-cover" />
              </div>
            )}
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">{material.title}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{material.category}</Badge>
                    <Badge variant="outline" className="uppercase text-xs">{material.file_type}</Badge>
                    {material.resource_type && material.resource_type !== "file" && (
                      <Badge variant="default" className="text-xs">{material.resource_type === "link" ? "External Link" : "File + Link"}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {displayViews(material.view_count)}</span>
                  <span className="flex items-center gap-1"><Download className="h-4 w-4" /> {displayDownloads(material.download_count)}</span>
                  {isTrending(material.view_count) && <Badge variant="secondary" className="text-xs gap-0.5"><TrendingUp className="h-3 w-3" /> Trending</Badge>}
                  {isPopular(material.download_count) && <Badge variant="default" className="text-xs gap-0.5"><Flame className="h-3 w-3" /> Popular</Badge>}
                </div>
              </div>

              {material.description && <p className="text-muted-foreground">{material.description}</p>}

              <div className="flex flex-wrap gap-3 pt-2">
                {/* Download button for file-based materials */}
                {settings.download && material.is_downloadable && hasFileUrl && (
                  <Button onClick={handleDownload} disabled={downloading}><Download className="h-4 w-4 mr-2" /> Download</Button>
                )}
                {/* Open Resource button for link-based materials */}
                {hasExternalUrl && (
                  <Button
                    variant={isLinkOnly ? "default" : "outline"}
                    onClick={() => {
                      // Track as download if admin marked as downloadable, otherwise just open
                      if (material.is_downloadable && isLinkOnly) {
                        handleDownload();
                      } else {
                        window.open(material.external_url, "_blank");
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" /> Open Resource
                  </Button>
                )}
                {settings.share && material.is_email_shareable && (
                  <Button variant="outline" onClick={() => setShareOpen(true)}><Mail className="h-4 w-4 mr-2" /> Send via Email</Button>
                )}
                <Button variant="outline" onClick={handleCopyLink}><Copy className="h-4 w-4 mr-2" /> Copy Link</Button>
                <Button variant="ghost" onClick={handleNativeShare}><Share2 className="h-4 w-4 mr-2" /> Share</Button>
              </div>

              <MaterialSocialButtons material={material} settings={settings} />

              {/* Preview for images/videos */}
              {material.file_type === "video" && material.file_url && (
                <video controls className="w-full rounded-lg mt-4"><source src={material.file_url} /></video>
              )}
              {material.file_type === "image" && material.file_url && (
                <img src={material.file_url} alt={material.title} className="w-full rounded-lg mt-4" />
              )}
              {material.file_type === "pdf" && material.file_url && (
                <iframe src={material.file_url} className="w-full h-[600px] rounded-lg mt-4 border border-border" title={material.title} />
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />

      {/* Email Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share via Email</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Recipient Email</label>
              <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareOpen(false)}>Cancel</Button>
              <Button onClick={handleEmailShare} disabled={sending || !recipientEmail.trim()}>{sending ? "Sending..." : "Send"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialDetail;
