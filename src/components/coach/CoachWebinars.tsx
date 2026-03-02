import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Video, Plus, Edit, Trash2, Users, Calendar, Clock, X, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Webinar {
  id: string;
  title: string;
  description: string | null;
  webinar_date: string;
  webinar_time: string;
  duration_minutes: number;
  webinar_link: string;
  is_published: boolean;
  created_at: string;
}

interface Registrant {
  id: string;
  learner_id: string;
  registered_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const CoachWebinars = () => {
  const { user } = useAuth();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Webinar | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [showRegistrants, setShowRegistrants] = useState<string | null>(null);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [webinarDate, setWebinarDate] = useState("");
  const [webinarTime, setWebinarTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [webinarLink, setWebinarLink] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchWebinars = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("webinars")
      .select("*")
      .eq("coach_id", user.id)
      .order("webinar_date", { ascending: false });
    setWebinars((data as Webinar[]) || []);

    // Fetch registration counts
    if (data && data.length > 0) {
      const { data: regs } = await supabase
        .from("webinar_registrations")
        .select("webinar_id")
        .in("webinar_id", data.map((w: any) => w.id));
      const counts: Record<string, number> = {};
      (regs || []).forEach((r: any) => {
        counts[r.webinar_id] = (counts[r.webinar_id] || 0) + 1;
      });
      setRegCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchWebinars(); }, [user]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setWebinarDate(""); setWebinarTime("");
    setDuration("60"); setWebinarLink(""); setEditing(null);
  };

  const openEdit = (w: Webinar) => {
    setEditing(w);
    setTitle(w.title);
    setDescription(w.description || "");
    setWebinarDate(w.webinar_date);
    setWebinarTime(w.webinar_time);
    setDuration(String(w.duration_minutes));
    setWebinarLink(w.webinar_link);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = {
      coach_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      webinar_date: webinarDate,
      webinar_time: webinarTime,
      duration_minutes: parseInt(duration),
      webinar_link: webinarLink.trim(),
    };

    if (editing) {
      const { error } = await supabase.from("webinars").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Webinar updated" }); }
    } else {
      const { error } = await supabase.from("webinars").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Webinar created" }); }
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
    fetchWebinars();
  };

  const deleteWebinar = async (id: string) => {
    if (!confirm("Delete this webinar? All registrations will be removed.")) return;
    const { error } = await supabase.from("webinars").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Webinar deleted" });
      setWebinars(webinars.filter((w) => w.id !== id));
    }
  };

  const viewRegistrants = async (webinarId: string) => {
    setShowRegistrants(webinarId);
    const { data } = await supabase
      .from("webinar_registrations")
      .select("id, learner_id, registered_at")
      .eq("webinar_id", webinarId)
      .order("registered_at", { ascending: false });

    if (data && data.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, contact_number")
        .in("user_id", data.map((r: any) => r.learner_id));

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setRegistrants(data.map((r: any) => ({
        ...r,
        profiles: profileMap.get(r.learner_id) || null,
      })));
    } else {
      setRegistrants([]);
    }
  };

  const downloadCSV = () => {
    const webinar = webinars.find((w) => w.id === showRegistrants);
    const rows = [["Name", "Email", "Phone", "Registered At"]];
    registrants.forEach((r) => {
      rows.push([
        r.profiles?.full_name || "Unknown",
        r.profiles?.email || "—",
        (r.profiles as any)?.contact_number || "—",
        format(new Date(r.registered_at), "yyyy-MM-dd HH:mm"),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${webinar?.title || "webinar"}-registrants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">My Webinars</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Webinar
        </Button>
      </div>

      {/* Webinar Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Webinar" : "Create Webinar"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Webinar Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date *</Label><Input type="date" value={webinarDate} onChange={(e) => setWebinarDate(e.target.value)} required /></div>
              <div><Label>Time *</Label><Input type="time" value={webinarTime} onChange={(e) => setWebinarTime(e.target.value)} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Duration (minutes) *</Label><Input type="number" min="15" value={duration} onChange={(e) => setDuration(e.target.value)} required /></div>
              <div><Label>Webinar Link *</Label><Input type="url" placeholder="https://zoom.us/..." value={webinarLink} onChange={(e) => setWebinarLink(e.target.value)} required /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registrants Dialog */}
      <Dialog open={!!showRegistrants} onOpenChange={(o) => { if (!o) setShowRegistrants(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Registered Learners ({registrants.length})</DialogTitle>
              {registrants.length > 0 && (
                <Button size="sm" variant="outline" onClick={downloadCSV} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download CSV
                </Button>
              )}
            </div>
          </DialogHeader>
          {registrants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No registrations yet</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {registrants.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.profiles?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{r.profiles?.email || "—"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(r.registered_at), "MMM d, yyyy")}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Webinar List */}
      {webinars.length === 0 ? (
        <div className="text-center py-16">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No webinars yet</h3>
          <p className="text-sm text-muted-foreground">Create your first webinar to engage learners</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {webinars.map((w) => {
            const isPast = new Date(`${w.webinar_date}T${w.webinar_time}`) < new Date();
            return (
              <div key={w.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isPast ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"}`}>
                    {isPast ? "Past" : "Upcoming"}
                  </span>
                  <button onClick={() => viewRegistrants(w.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Users className="h-3 w-3" /> {regCounts[w.id] || 0}
                  </button>
                </div>
                <h3 className="text-sm font-bold text-foreground">{w.title}</h3>
                {w.description && <p className="text-xs text-muted-foreground line-clamp-2">{w.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(w.webinar_date), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{w.webinar_time.slice(0, 5)}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button onClick={() => openEdit(w)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => deleteWebinar(w.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive ml-auto">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoachWebinars;
