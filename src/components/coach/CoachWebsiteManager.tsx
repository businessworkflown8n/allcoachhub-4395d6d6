import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Globe, Save, Send, Eye, Loader2, Upload, Palette, ExternalLink } from "lucide-react";

interface WebsiteData {
  id?: string;
  institute_name: string;
  slug: string;
  tagline: string;
  description: string;
  logo_url: string;
  banner_url: string;
  theme_color: string;
  video_url: string;
  about_text: string;
  social_links: Record<string, string>;
  show_courses: boolean;
  show_testimonials: boolean;
  show_about: boolean;
  show_contact: boolean;
  show_video: boolean;
  meta_title: string;
  meta_description: string;
  status: string;
  is_live: boolean;
  admin_note: string;
}

const defaultData: WebsiteData = {
  institute_name: "",
  slug: "",
  tagline: "",
  description: "",
  logo_url: "",
  banner_url: "",
  theme_color: "#6366f1",
  video_url: "",
  about_text: "",
  social_links: { linkedin: "", twitter: "", youtube: "", instagram: "" },
  show_courses: true,
  show_testimonials: false,
  show_about: true,
  show_contact: false,
  show_video: false,
  meta_title: "",
  meta_description: "",
  status: "draft",
  is_live: false,
  admin_note: "",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-destructive/20 text-destructive",
};

const CoachWebsiteManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<WebsiteData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: website } = await supabase
        .from("coach_websites")
        .select("*")
        .eq("coach_id", user.id)
        .maybeSingle();
      if (website) {
        setData({
          id: website.id,
          institute_name: website.institute_name || "",
          slug: website.slug || "",
          tagline: website.tagline || "",
          description: website.description || "",
          logo_url: website.logo_url || "",
          banner_url: website.banner_url || "",
          theme_color: website.theme_color || "#6366f1",
          video_url: website.video_url || "",
          about_text: website.about_text || "",
          social_links: (website.social_links as Record<string, string>) || defaultData.social_links,
          show_courses: website.show_courses ?? true,
          show_testimonials: website.show_testimonials ?? false,
          show_about: website.show_about ?? true,
          show_contact: website.show_contact ?? false,
          show_video: website.show_video ?? false,
          meta_title: website.meta_title || "",
          meta_description: website.meta_description || "",
          status: website.status || "draft",
          is_live: website.is_live ?? false,
          admin_note: website.admin_note || "",
        });
        setExists(true);
      } else {
        // Pre-fill from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, company_name")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          const name = profile.company_name || profile.full_name || "";
          setData((prev) => ({
            ...prev,
            institute_name: name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          }));
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSlugChange = (val: string) => {
    setData((prev) => ({ ...prev, slug: val.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-") }));
  };

  const handleUpload = async (type: "logo" | "banner", file: File) => {
    if (!user) return;
    setUploading(type);
    const ext = file.name.split(".").pop();
    const path = `coach-websites/${user.id}/${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      setData((prev) => ({ ...prev, [`${type}_url`]: urlData.publicUrl }));
      toast({ title: `${type === "logo" ? "Logo" : "Banner"} uploaded` });
    }
    setUploading(null);
  };

  const completionPercent = useCallback(() => {
    const fields = [data.institute_name, data.slug, data.tagline, data.description, data.about_text, data.logo_url, data.banner_url, data.meta_title, data.meta_description];
    const filled = fields.filter((f) => f && f.trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  }, [data]);

  const saveDraft = async () => {
    if (!user || !data.slug || !data.institute_name) {
      toast({ title: "Please fill institute name and URL slug", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      coach_id: user.id,
      institute_name: data.institute_name,
      slug: data.slug,
      tagline: data.tagline || null,
      description: data.description || null,
      logo_url: data.logo_url || null,
      banner_url: data.banner_url || null,
      theme_color: data.theme_color || "#6366f1",
      video_url: data.video_url || null,
      about_text: data.about_text || null,
      social_links: data.social_links,
      show_courses: data.show_courses,
      show_testimonials: data.show_testimonials,
      show_about: data.show_about,
      show_contact: data.show_contact,
      show_video: data.show_video,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      status: data.status === "rejected" ? "draft" : data.status,
      updated_at: new Date().toISOString(),
    };
    let error;
    if (exists && data.id) {
      ({ error } = await supabase.from("coach_websites").update(payload).eq("id", data.id));
    } else {
      const { data: inserted, error: insertError } = await supabase.from("coach_websites").insert(payload).select().single();
      error = insertError;
      if (inserted) { setData((prev) => ({ ...prev, id: inserted.id })); setExists(true); }
    }
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      if (data.status === "rejected") setData((prev) => ({ ...prev, status: "draft" }));
      toast({ title: "Draft saved successfully" });
    }
    setSaving(false);
  };

  const submitForApproval = async () => {
    await saveDraft();
    if (!data.id && !exists) return;
    const { error } = await supabase.from("coach_websites").update({ status: "pending", updated_at: new Date().toISOString() }).eq("coach_id", user!.id);
    if (!error) {
      setData((prev) => ({ ...prev, status: "pending" }));
      toast({ title: "Submitted for approval", description: "Your website is under review by admin." });
    }
  };

  const isLocked = data.status === "pending";

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> My Website
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Create your public institute landing page</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={STATUS_COLORS[data.status] || ""}>{data.status.charAt(0).toUpperCase() + data.status.slice(1)}</Badge>
          {data.status === "approved" && data.is_live && (
            <a href={`/coach-website/${data.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" /> View Live</Button>
            </a>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Website Completion</span>
            <span className="text-sm font-bold text-primary">{completionPercent()}%</span>
          </div>
          <Progress value={completionPercent()} className="h-2" />
        </CardContent>
      </Card>

      {/* Admin Note */}
      {data.admin_note && (data.status === "rejected" || data.status === "draft") && (
        <Card className="border-destructive/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-destructive">Admin Feedback:</p>
            <p className="text-sm text-muted-foreground mt-1">{data.admin_note}</p>
          </CardContent>
        </Card>
      )}

      {isLocked && (
        <Card className="border-yellow-500/50">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-yellow-400 font-medium">🔒 Your website is under review by admin. Editing is locked until a decision is made.</p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <div className={`space-y-6 ${isLocked ? "opacity-60 pointer-events-none" : ""}`}>
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Institute Name *</Label>
                <Input value={data.institute_name} onChange={(e) => setData((p) => ({ ...p, institute_name: e.target.value }))} placeholder="My AI Academy" />
              </div>
              <div className="space-y-2">
                <Label>URL Slug *</Label>
                <Input value={data.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="my-ai-academy" />
                <p className="text-xs text-muted-foreground">aicoachportal.com/coach-website/{data.slug || "your-slug"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={data.tagline} onChange={(e) => setData((p) => ({ ...p, tagline: e.target.value }))} placeholder="Empowering through AI education" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={data.description} onChange={(e) => setData((p) => ({ ...p, description: e.target.value }))} placeholder="Tell visitors about your institute..." rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {data.logo_url && <img src={data.logo_url} alt="Logo" className="h-12 w-12 rounded-md object-cover border border-border" />}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload("logo", e.target.files[0])} />
                    <Button variant="outline" size="sm" asChild><span>{uploading === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}{uploading === "logo" ? "Uploading..." : "Upload Logo"}</span></Button>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cover Banner</Label>
                <div className="flex items-center gap-3">
                  {data.banner_url && <img src={data.banner_url} alt="Banner" className="h-12 w-24 rounded-md object-cover border border-border" />}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload("banner", e.target.files[0])} />
                    <Button variant="outline" size="sm" asChild><span>{uploading === "banner" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}{uploading === "banner" ? "Uploading..." : "Upload Banner"}</span></Button>
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={data.theme_color} onChange={(e) => setData((p) => ({ ...p, theme_color: e.target.value }))} className="h-10 w-10 cursor-pointer rounded border border-border" />
                <Input value={data.theme_color} onChange={(e) => setData((p) => ({ ...p, theme_color: e.target.value }))} className="max-w-[140px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <Card>
          <CardHeader><CardTitle className="text-base">Content Sections</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: "show_about", label: "About Us" },
                { key: "show_courses", label: "Courses Offered" },
                { key: "show_testimonials", label: "Testimonials" },
                { key: "show_contact", label: "Contact Info" },
                { key: "show_video", label: "Intro Video" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm text-foreground">{label}</span>
                  <Switch checked={(data as any)[key]} onCheckedChange={(v) => setData((p) => ({ ...p, [key]: v }))} />
                </div>
              ))}
            </div>
            {data.show_about && (
              <div className="space-y-2">
                <Label>About Us Content</Label>
                <Textarea value={data.about_text} onChange={(e) => setData((p) => ({ ...p, about_text: e.target.value }))} rows={4} placeholder="Write about your institute..." />
              </div>
            )}
            {data.show_video && (
              <div className="space-y-2">
                <Label>Intro Video (YouTube URL)</Label>
                <Input value={data.video_url} onChange={(e) => setData((p) => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader><CardTitle className="text-base">Social Links</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {["linkedin", "twitter", "youtube", "instagram"].map((platform) => (
                <div key={platform} className="space-y-1">
                  <Label className="capitalize">{platform}</Label>
                  <Input
                    value={data.social_links[platform] || ""}
                    onChange={(e) => setData((p) => ({ ...p, social_links: { ...p.social_links, [platform]: e.target.value } }))}
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader><CardTitle className="text-base">SEO Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input value={data.meta_title} onChange={(e) => setData((p) => ({ ...p, meta_title: e.target.value }))} placeholder="Page title for search engines" maxLength={60} />
              <p className="text-xs text-muted-foreground">{data.meta_title.length}/60 characters</p>
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea value={data.meta_description} onChange={(e) => setData((p) => ({ ...p, meta_description: e.target.value }))} placeholder="Brief description for search results" rows={2} maxLength={160} />
              <p className="text-xs text-muted-foreground">{data.meta_description.length}/160 characters</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {!isLocked && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {data.slug && (
            <a href={`/coach-website/${data.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline"><Eye className="h-4 w-4 mr-1" /> Preview</Button>
            </a>
          )}
          <Button variant="outline" onClick={saveDraft} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save Draft
          </Button>
          {data.status !== "approved" && (
            <Button onClick={submitForApproval} disabled={saving || completionPercent() < 40}>
              <Send className="h-4 w-4 mr-1" /> Submit for Approval
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CoachWebsiteManager;
