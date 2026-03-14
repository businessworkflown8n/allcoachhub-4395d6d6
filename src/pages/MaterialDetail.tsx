import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
import { Download, Mail, ArrowLeft, Eye, Lock } from "lucide-react";
import MaterialSocialButtons from "@/components/MaterialSocialButtons";

const MaterialDetail = () => {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
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
        await supabase.from("materials").update({ view_count: (data.view_count || 0) + 1 }).eq("id", data.id);
      }
      setLoading(false);
    };
    fetchMaterial();
  }, [user, slug]);

  const handleDownload = async () => {
    if (!material?.file_url) return;
    await supabase.from("materials").update({ download_count: (material.download_count || 0) + 1 }).eq("id", material.id);
    setMaterial((prev: any) => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
    window.open(material.file_url, "_blank");
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

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Login Required</h1>
            <p className="text-muted-foreground mb-6">Please login to access learning materials.</p>
            <Link to="/auth?mode=login" className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">Sign In</Link>
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
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {material.view_count}</span>
                  <span className="flex items-center gap-1"><Download className="h-4 w-4" /> {material.download_count}</span>
                </div>
              </div>

              {material.description && <p className="text-muted-foreground">{material.description}</p>}

              <div className="flex flex-wrap gap-3 pt-2">
                {settings.download && material.is_downloadable && material.file_url && (
                  <Button onClick={handleDownload}><Download className="h-4 w-4 mr-2" /> Download</Button>
                )}
                {settings.share && material.is_email_shareable && (
                  <Button variant="outline" onClick={() => setShareOpen(true)}><Mail className="h-4 w-4 mr-2" /> Send via Email</Button>
                )}
              </div>

              {/* Social Media Buttons */}
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
