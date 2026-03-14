import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const CoachProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      bio: profile.bio,
      category: profile.category,
      experience: profile.experience,
      certifications: profile.certifications,
      social_links: profile.social_links,
      intro_video_url: profile.intro_video_url,
      contact_number: profile.contact_number,
      country: profile.country,
      city: profile.city,
      linkedin_profile: profile.linkedin_profile,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-foreground">Coach Profile</h2>
      {profile?.slug && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Your landing page:</span>
          <code className="rounded bg-background px-2 py-0.5 text-sm">{window.location.origin}/coach/{profile.slug}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/coach/${profile.slug}`);
              toast({ title: "Link copied!" });
            }}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent"
          >
            Copy
          </button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground">Full Name</Label>
          <Input value={profile?.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Category</Label>
          <Input value={profile?.category || ""} onChange={(e) => setProfile({ ...profile, category: e.target.value })} className="bg-secondary border-border" placeholder="e.g. AI, Marketing" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Experience</Label>
          <Input value={profile?.experience || ""} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} className="bg-secondary border-border" placeholder="e.g. 10+ years in AI" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Contact Number</Label>
          <Input value={profile?.contact_number || ""} onChange={(e) => setProfile({ ...profile, contact_number: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Country</Label>
          <Input value={profile?.country || ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">City</Label>
          <Input value={profile?.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-foreground">LinkedIn</Label>
          <Input value={profile?.linkedin_profile || ""} onChange={(e) => setProfile({ ...profile, linkedin_profile: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-foreground">Intro Video URL</Label>
          <Input value={profile?.intro_video_url || ""} onChange={(e) => setProfile({ ...profile, intro_video_url: e.target.value })} className="bg-secondary border-border" placeholder="https://youtube.com/..." />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Bio</Label>
        <Textarea value={profile?.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="bg-secondary border-border" rows={4} />
      </div>
      <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default CoachProfile;
