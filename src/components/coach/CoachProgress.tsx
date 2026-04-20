import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  target_date: string | null;
  progress_percent: number;
  status: string;
  priority: string;
}

interface Client { id: string; full_name: string; }

export default function CoachProgress() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState({ client_id: "", title: "", description: "", target_date: "", progress_percent: 0, priority: "medium" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [g, c] = await Promise.all([
      supabase.from("client_goals").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }),
      supabase.from("coach_clients").select("id, full_name").eq("coach_id", user.id),
    ]);
    setGoals((g.data || []) as any);
    setClients((c.data || []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const openNew = () => { setEditing(null); setForm({ client_id: "", title: "", description: "", target_date: "", progress_percent: 0, priority: "medium" }); setOpen(true); };
  const openEdit = (g: Goal) => { setEditing(g); setForm({ client_id: g.client_id || "", title: g.title, description: g.description || "", target_date: g.target_date || "", progress_percent: g.progress_percent, priority: g.priority }); setOpen(true); };

  const save = async () => {
    if (!user || !form.title.trim()) { toast.error("Title required"); return; }
    const payload = { ...form, coach_id: user.id, client_id: form.client_id || null, target_date: form.target_date || null, progress_percent: Number(form.progress_percent) };
    const { error } = editing
      ? await supabase.from("client_goals").update(payload).eq("id", editing.id)
      : await supabase.from("client_goals").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setOpen(false); load();
  };

  const updateProgress = async (id: string, val: number) => {
    const status = val >= 100 ? "completed" : "active";
    await supabase.from("client_goals").update({ progress_percent: val, status }).eq("id", id);
    load();
  };
  const remove = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("client_goals").delete().eq("id", id); load(); };

  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.full_name || "—";
  const active = goals.filter((g) => g.status === "active").length;
  const completed = goals.filter((g) => g.status === "completed").length;
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress_percent, 0) / goals.length) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Target className="h-5 w-5" /> Progress Tracker</h2>
          <p className="text-sm text-muted-foreground">Track client goals, milestones, and weekly progress</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Goal</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Active Goals</p><p className="text-2xl font-bold">{active}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Completed</p><p className="text-2xl font-bold">{completed}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Avg Progress</p><p className="text-2xl font-bold">{avgProgress}%</p></div>
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : goals.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl"><Target className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">No goals yet.</p></div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{g.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{clientName(g.client_id)} {g.target_date && `· Due ${new Date(g.target_date).toLocaleDateString()}`}</div>
                  {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={g.status === "completed" ? "default" : "secondary"}>{g.status}</Badge>
                  <Badge variant="outline">{g.priority}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span><span className="font-semibold">{g.progress_percent}%</span>
                </div>
                <Progress value={g.progress_percent} />
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {[25, 50, 75, 100].map((v) => (
                  <Button key={v} size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateProgress(g.id, v)}>{v}%</Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => openEdit(g)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Goal" : "Add Goal"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Client</Label>
              <Select value={form.client_id || "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">— None —</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Target Date</Label><Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["low", "medium", "high"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Progress %</Label><Input type="number" min={0} max={100} value={form.progress_percent} onChange={(e) => setForm({ ...form, progress_percent: Number(e.target.value) })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
