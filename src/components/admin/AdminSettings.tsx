import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Settings, Users, Percent, Eye, Video } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CoachProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface CoachCommission {
  coach_id: string;
  commission_percent: number;
}

const AdminSettings = () => {
  const [commission, setCommission] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Multiplier state
  const [viewMultiplier, setViewMultiplier] = useState("10");
  const [downloadMultiplier, setDownloadMultiplier] = useState("5");
  const [savingMultiplier, setSavingMultiplier] = useState(false);

  // Coach commission state
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [coachCommissions, setCoachCommissions] = useState<CoachCommission[]>([]);
  const [selectedCoach, setSelectedCoach] = useState("");
  const [coachCommission, setCoachCommission] = useState("");
  const [savingCoach, setSavingCoach] = useState(false);

  // Webinar commission state
  const [webinarCommission, setWebinarCommission] = useState("1");
  const [savingWebinar, setSavingWebinar] = useState(false);
  const [coachWebinarCommissions, setCoachWebinarCommissions] = useState<CoachCommission[]>([]);
  const [selectedWebinarCoach, setSelectedWebinarCoach] = useState("");
  const [coachWebinarCommission, setCoachWebinarCommission] = useState("");
  const [savingWebinarCoach, setSavingWebinarCoach] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [settingsRes, coachRolesRes, commissionsRes, multiplierRes, webinarSettingsRes, webinarCommRes] = await Promise.all([
      supabase.from("platform_settings").select("*").eq("key", "commission_percent").single(),
      supabase.from("user_roles").select("user_id").eq("role", "coach"),
      supabase.from("coach_commissions").select("coach_id, commission_percent"),
      supabase.from("platform_settings").select("key, value").in("key", ["material_view_multiplier", "material_download_multiplier"]),
      supabase.from("platform_settings").select("value").eq("key", "webinar_commission_percent").single(),
      supabase.from("coach_webinar_commissions").select("coach_id, commission_percent"),
    ]);

    setCommission(settingsRes.data?.value || "20");
    setCoachCommissions(commissionsRes.data || []);
    setWebinarCommission(webinarSettingsRes.data?.value || "1");
    setCoachWebinarCommissions(webinarCommRes.data || []);
    if (multiplierRes.data) {
      multiplierRes.data.forEach((r: any) => {
        if (r.key === "material_view_multiplier") setViewMultiplier(r.value);
        if (r.key === "material_download_multiplier") setDownloadMultiplier(r.value);
      });
    }

    if (coachRolesRes.data && coachRolesRes.data.length > 0) {
      const coachIds = coachRolesRes.data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", coachIds);
      setCoaches(profiles || []);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({ value: commission }).eq("key", "commission_percent");
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Default commission saved" });
  };

  const handleSaveCoachCommission = async () => {
    if (!selectedCoach || !coachCommission) return;
    setSavingCoach(true);
    const existing = coachCommissions.find((c) => c.coach_id === selectedCoach);
    let error;
    if (existing) {
      ({ error } = await supabase.from("coach_commissions").update({ commission_percent: Number(coachCommission) }).eq("coach_id", selectedCoach));
    } else {
      ({ error } = await supabase.from("coach_commissions").insert({ coach_id: selectedCoach, commission_percent: Number(coachCommission) }));
    }
    setSavingCoach(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coach commission saved" });
      const { data } = await supabase.from("coach_commissions").select("coach_id, commission_percent");
      setCoachCommissions(data || []);
      setSelectedCoach("");
      setCoachCommission("");
    }
  };

  // Webinar commission handlers
  const handleSaveWebinarDefault = async () => {
    setSavingWebinar(true);
    const { data } = await supabase.from("platform_settings").select("id").eq("key", "webinar_commission_percent").single();
    let error;
    if (data) {
      ({ error } = await supabase.from("platform_settings").update({ value: webinarCommission }).eq("key", "webinar_commission_percent"));
    } else {
      ({ error } = await supabase.from("platform_settings").insert({ key: "webinar_commission_percent", value: webinarCommission }));
    }
    setSavingWebinar(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Default webinar commission saved" });
  };

  const handleSaveWebinarCoachCommission = async () => {
    if (!selectedWebinarCoach || !coachWebinarCommission) return;
    setSavingWebinarCoach(true);
    const existing = coachWebinarCommissions.find((c) => c.coach_id === selectedWebinarCoach);
    let error;
    if (existing) {
      ({ error } = await supabase.from("coach_webinar_commissions").update({ commission_percent: Number(coachWebinarCommission) }).eq("coach_id", selectedWebinarCoach));
    } else {
      ({ error } = await supabase.from("coach_webinar_commissions").insert({ coach_id: selectedWebinarCoach, commission_percent: Number(coachWebinarCommission) }));
    }
    setSavingWebinarCoach(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coach webinar commission saved" });
      const { data } = await supabase.from("coach_webinar_commissions").select("coach_id, commission_percent");
      setCoachWebinarCommissions(data || []);
      setSelectedWebinarCoach("");
      setCoachWebinarCommission("");
    }
  };

  const getCoachName = (coachId: string) => {
    const coach = coaches.find((c) => c.user_id === coachId);
    return coach?.full_name || coach?.email || coachId.slice(0, 8);
  };

  const getCoachCommission = (coachId: string) => {
    const cc = coachCommissions.find((c) => c.coach_id === coachId);
    return cc ? `${cc.commission_percent}%` : `${commission || 20}% (default)`;
  };

  const getCoachWebinarCommission = (coachId: string) => {
    const cc = coachWebinarCommissions.find((c) => c.coach_id === coachId);
    return cc ? `${cc.commission_percent}%` : `${webinarCommission || 1}% (default)`;
  };

  const handleSaveMultiplier = async () => {
    setSavingMultiplier(true);
    const upsert = async (key: string, value: string) => {
      const { data } = await supabase.from("platform_settings").select("id").eq("key", key).single();
      if (data) {
        await supabase.from("platform_settings").update({ value }).eq("key", key);
      } else {
        await supabase.from("platform_settings").insert({ key, value });
      }
    };
    await Promise.all([
      upsert("material_view_multiplier", viewMultiplier),
      upsert("material_download_multiplier", downloadMultiplier),
    ]);
    setSavingMultiplier(false);
    toast({ title: "Engagement multipliers saved" });
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-xl font-bold text-foreground">Platform Settings</h2>

      {/* Default Course Commission */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Default Course Commission</h3>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Platform Commission (%)</Label>
          <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="bg-secondary border-border" min="0" max="100" />
          <p className="text-xs text-muted-foreground">Applied to coaches without a custom commission rate</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {saving ? "Saving..." : "Save Default"}
        </button>
      </div>

      {/* Per-Coach Course Commission */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Coach-Specific Course Commission</h3>
        </div>
        <p className="text-xs text-muted-foreground">Set a custom commission rate for individual coaches. Overrides the default rate.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-foreground">Select Coach</Label>
            <Select value={selectedCoach} onValueChange={(val) => {
              setSelectedCoach(val);
              const existing = coachCommissions.find((c) => c.coach_id === val);
              setCoachCommission(existing ? String(existing.commission_percent) : "");
            }}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Choose a coach..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {coaches.map((coach) => (
                  <SelectItem key={coach.user_id} value={coach.user_id}>
                    {coach.full_name || coach.email || coach.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Commission (%)</Label>
            <Input type="number" value={coachCommission} onChange={(e) => setCoachCommission(e.target.value)} className="bg-secondary border-border" min="0" max="100" placeholder={`Default: ${commission || 20}%`} />
          </div>
        </div>
        <button onClick={handleSaveCoachCommission} disabled={savingCoach || !selectedCoach || !coachCommission} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {savingCoach ? "Saving..." : "Save Coach Commission"}
        </button>
      </div>

      {/* All Coaches Course Commission Table */}
      {coaches.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">All Coaches – Course Commission</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map((coach) => (
                <TableRow key={coach.user_id}>
                  <TableCell className="font-medium text-foreground">{coach.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{coach.email || "—"}</TableCell>
                  <TableCell className="text-right font-semibold text-foreground">{getCoachCommission(coach.user_id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Default Webinar Commission */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Default Webinar Commission</h3>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Platform Commission (%)</Label>
          <Input type="number" value={webinarCommission} onChange={(e) => setWebinarCommission(e.target.value)} className="bg-secondary border-border" min="0" max="100" />
          <p className="text-xs text-muted-foreground">Applied when no custom webinar commission exists for a coach</p>
        </div>
        <button onClick={handleSaveWebinarDefault} disabled={savingWebinar} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {savingWebinar ? "Saving..." : "Save Default"}
        </button>
      </div>

      {/* Per-Coach Webinar Commission */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Coach-Specific Webinar Commission</h3>
        </div>
        <p className="text-xs text-muted-foreground">Set a custom webinar commission rate. Overrides the default webinar rate.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-foreground">Select Coach</Label>
            <Select value={selectedWebinarCoach} onValueChange={(val) => {
              setSelectedWebinarCoach(val);
              const existing = coachWebinarCommissions.find((c) => c.coach_id === val);
              setCoachWebinarCommission(existing ? String(existing.commission_percent) : "");
            }}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Choose a coach..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {coaches.map((coach) => (
                  <SelectItem key={coach.user_id} value={coach.user_id}>
                    {coach.full_name || coach.email || coach.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Commission (%)</Label>
            <Input type="number" value={coachWebinarCommission} onChange={(e) => setCoachWebinarCommission(e.target.value)} className="bg-secondary border-border" min="0" max="100" placeholder={`Default: ${webinarCommission || 1}%`} />
          </div>
        </div>
        <button onClick={handleSaveWebinarCoachCommission} disabled={savingWebinarCoach || !selectedWebinarCoach || !coachWebinarCommission} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {savingWebinarCoach ? "Saving..." : "Save Coach Commission"}
        </button>
      </div>

      {/* All Coaches Webinar Commission Table */}
      {coaches.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">All Coaches – Webinar Commission</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map((coach) => (
                <TableRow key={coach.user_id}>
                  <TableCell className="font-medium text-foreground">{coach.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{coach.email || "—"}</TableCell>
                  <TableCell className="text-right font-semibold text-foreground">{getCoachWebinarCommission(coach.user_id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Engagement Multiplier Settings */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Engagement Display Multiplier</h3>
        </div>
        <p className="text-xs text-muted-foreground">Boost visible view/download counts for social proof. Actual data stays unchanged in analytics.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-foreground">View Multiplier (×)</Label>
            <Input type="number" value={viewMultiplier} onChange={(e) => setViewMultiplier(e.target.value)} className="bg-secondary border-border" min="1" max="100" />
            <p className="text-xs text-muted-foreground">e.g. 10 = 1 real view shows as 10</p>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Download Multiplier (×)</Label>
            <Input type="number" value={downloadMultiplier} onChange={(e) => setDownloadMultiplier(e.target.value)} className="bg-secondary border-border" min="1" max="100" />
            <p className="text-xs text-muted-foreground">e.g. 5 = 1 real download shows as 5</p>
          </div>
        </div>
        <button onClick={handleSaveMultiplier} disabled={savingMultiplier} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {savingMultiplier ? "Saving..." : "Save Multipliers"}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
