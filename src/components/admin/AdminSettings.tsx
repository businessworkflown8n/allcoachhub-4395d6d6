import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

const AdminSettings = () => {
  const [commission, setCommission] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("*").eq("key", "commission_percent").single().then(({ data }) => {
      setCommission(data?.value || "20");
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({ value: commission }).eq("key", "commission_percent");
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Settings saved" });
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="max-w-md space-y-6">
      <h2 className="text-xl font-bold text-foreground">Platform Settings</h2>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Commission System</h3>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Platform Commission (%)</Label>
          <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="bg-secondary border-border" min="0" max="100" />
          <p className="text-xs text-muted-foreground">This percentage is automatically deducted from each payment</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
