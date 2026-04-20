import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Pkg {
  id: string;
  name: string;
  description: string | null;
  package_type: string;
  price: number;
  currency: string;
  billing_interval: string;
  sessions_included: number | null;
  duration_weeks: number | null;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
}

const TYPES = ["one_on_one", "group", "membership", "workshop", "digital"];
const INTERVALS = ["one_time", "monthly", "yearly"];

export default function CoachPackages() {
  const { user } = useAuth();
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", package_type: "one_on_one", price: 0, currency: "INR",
    billing_interval: "one_time", sessions_included: 0, duration_weeks: 0, is_active: true, is_featured: false,
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("coach_packages").select("*").eq("coach_id", user.id).order("sort_order", { ascending: true });
    setPkgs(((data || []) as any[]).map((p) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const openNew = () => { setEditing(null); setFeaturesText(""); setForm({ name: "", description: "", package_type: "one_on_one", price: 0, currency: "INR", billing_interval: "one_time", sessions_included: 0, duration_weeks: 0, is_active: true, is_featured: false }); setOpen(true); };
  const openEdit = (p: Pkg) => {
    setEditing(p);
    setFeaturesText((p.features || []).join("\n"));
    setForm({ name: p.name, description: p.description || "", package_type: p.package_type, price: Number(p.price), currency: p.currency, billing_interval: p.billing_interval, sessions_included: p.sessions_included || 0, duration_weeks: p.duration_weeks || 0, is_active: p.is_active, is_featured: p.is_featured });
    setOpen(true);
  };

  const save = async () => {
    if (!user || !form.name.trim()) { toast.error("Name required"); return; }
    const features = featuresText.split("\n").map((s) => s.trim()).filter(Boolean);
    const payload = {
      ...form, coach_id: user.id, features,
      price: Number(form.price), sessions_included: Number(form.sessions_included) || null, duration_weeks: Number(form.duration_weeks) || null,
    };
    const { error } = editing
      ? await supabase.from("coach_packages").update(payload).eq("id", editing.id)
      : await supabase.from("coach_packages").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setOpen(false); load();
  };
  const remove = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("coach_packages").delete().eq("id", id); load(); };
  const toggleActive = async (p: Pkg) => { await supabase.from("coach_packages").update({ is_active: !p.is_active }).eq("id", p.id); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Package className="h-5 w-5" /> Package Builder</h2>
          <p className="text-sm text-muted-foreground">Create 1:1, group, membership, and workshop offerings</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Package</Button>
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : pkgs.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl"><Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">No packages yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pkgs.map((p) => (
            <div key={p.id} className={`rounded-xl border p-4 space-y-2 ${p.is_featured ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1">{p.name}{p.is_featured && <Star className="h-3 w-3 text-primary fill-primary" />}</div>
                  <Badge variant="outline" className="mt-1 text-xs">{p.package_type.replace("_", " ")}</Badge>
                </div>
                <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {p.currency} {Number(p.price).toLocaleString()}
                <span className="text-xs text-muted-foreground ml-1">/ {p.billing_interval.replace("_", " ")}</span>
              </div>
              {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
              {p.features.length > 0 && (
                <ul className="text-xs space-y-0.5 text-muted-foreground">
                  {p.features.slice(0, 4).map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Package" : "New Package"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.package_type} onValueChange={(v) => setForm({ ...form, package_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Billing</Label>
                <Select value={form.billing_interval} onValueChange={(v) => setForm({ ...form, billing_interval: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INTERVALS.map((i) => <SelectItem key={i} value={i}>{i.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>Sessions</Label><Input type="number" value={form.sessions_included} onChange={(e) => setForm({ ...form, sessions_included: Number(e.target.value) })} /></div>
              <div><Label>Weeks</Label><Input type="number" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Features (one per line)</Label><Textarea rows={4} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Weekly 1:1 calls&#10;WhatsApp support&#10;Resource library" /></div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Active</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /> Featured</label>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
