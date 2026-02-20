import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const LearnerProfile = () => {
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
      contact_number: profile.contact_number,
      whatsapp_number: profile.whatsapp_number,
      education: profile.education,
      job_title: profile.job_title,
      industry: profile.industry,
      experience_level: profile.experience_level,
      country: profile.country,
      city: profile.city,
      linkedin_profile: profile.linkedin_profile,
      bio: profile.bio,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-foreground">My Profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground">Full Name</Label>
          <Input value={profile?.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Email</Label>
          <Input value={user?.email || ""} readOnly className="bg-secondary/50 border-border cursor-not-allowed" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Contact Number</Label>
          <Input value={profile?.contact_number || ""} onChange={(e) => setProfile({ ...profile, contact_number: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">WhatsApp</Label>
          <Input value={profile?.whatsapp_number || ""} onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Country</Label>
          <Input value={profile?.country || ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">City</Label>
          <Input value={profile?.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Job Title</Label>
          <Input value={profile?.job_title || ""} onChange={(e) => setProfile({ ...profile, job_title: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Industry</Label>
          <Input value={profile?.industry || ""} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">LinkedIn</Label>
          <Input value={profile?.linkedin_profile || ""} onChange={(e) => setProfile({ ...profile, linkedin_profile: e.target.value })} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Education</Label>
          <Input value={profile?.education || ""} onChange={(e) => setProfile({ ...profile, education: e.target.value })} className="bg-secondary border-border" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Bio</Label>
        <Textarea value={profile?.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="bg-secondary border-border" rows={3} />
      </div>
      <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

export default LearnerProfile;
