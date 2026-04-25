import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, X, Send, Users, Trash2, Megaphone, MailWarning } from "lucide-react";
import AdminInactiveReminder from "./AdminInactiveReminder";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Req {
  id: string;
  submitted_by: string;
  submitter_role: string;
  title: string;
  message: string;
  cta_link: string | null;
  audience_type: string;
  course_id: string | null;
  status: string;
  reviewer_note: string | null;
  recipients_count: number;
  created_at: string;
  sent_at: string | null;
}

interface CoachPerm {
  coach_id: string;
  is_blocked: boolean;
  notes: string | null;
}

const AdminNotificationCenter = () => {
  const { user } = useAuth();
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [requests, setRequests] = useState<Req[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [perms, setPerms] = useState<CoachPerm[]>([]);
  const [coaches, setCoaches] = useState<Array<{ user_id: string; full_name: string | null; email: string | null }>>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  // Direct admin send
  const [adminTitle, setAdminTitle] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminCta, setAdminCta] = useState("");

  const loadSettings = async () => {
    const { data } = await supabase.from("notification_settings" as any).select("*");
    const map = new Map<string, boolean>(((data as any) || []).map((s: any) => [s.key, s.enabled]));
    setGlobalEnabled(map.get("global_notifications_enabled") ?? true);
    setCoachEnabled(map.get("coach_notifications_enabled") ?? true);
  };

  const loadRequests = async () => {
    let q = supabase.from("notification_requests" as any).select("*").order("created_at", { ascending: false }).limit(200);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    const list: Req[] = (data as any) || [];
    setRequests(list);
    // hydrate names
    const ids = Array.from(new Set(list.map((r) => r.submitted_by)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p.full_name || p.email || "Unknown"; });
      setProfileMap(map);
    }
  };

  const loadCoaches = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "coach");
    const ids = (roles || []).map((r: any) => r.user_id);
    if (!ids.length) return;
    const [{ data: profs }, { data: pms }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids),
      supabase.from("coach_notification_permissions" as any).select("*").in("coach_id", ids),
    ]);
    setCoaches((profs as any) || []);
    setPerms((pms as any) || []);
  };

  useEffect(() => { loadSettings(); loadCoaches(); }, []);
  useEffect(() => { loadRequests(); }, [statusFilter]);

  const toggleSetting = async (key: string, value: boolean) => {
    const { error } = await supabase.from("notification_settings" as any).update({ enabled: value, updated_by: user?.id, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    loadSettings();
  };

  const approve = async (id: string) => {
    const { data, error } = await supabase.rpc("approve_notification_request" as any, { _request_id: id });
    if (error) return toast.error(error.message);
    toast.success(`Sent to ${(data as any)?.recipients ?? 0} learners`);
    loadRequests();
  };

  const reject = async () => {
    if (!rejectId) return;
    const { error } = await supabase.rpc("reject_notification_request" as any, { _request_id: rejectId, _reviewer_note: rejectNote || null });
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    setRejectId(null); setRejectNote("");
    loadRequests();
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    const { error } = await supabase.from("notification_requests" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadRequests();
  };

  const toggleCoachBlock = async (coachId: string, blocked: boolean) => {
    const existing = perms.find((p) => p.coach_id === coachId);
    if (existing) {
      const { error } = await supabase.from("coach_notification_permissions" as any).update({ is_blocked: blocked, updated_by: user?.id, updated_at: new Date().toISOString() }).eq("coach_id", coachId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("coach_notification_permissions" as any).insert({ coach_id: coachId, is_blocked: blocked, updated_by: user?.id });
      if (error) return toast.error(error.message);
    }
    loadCoaches();
  };

  const sendAdminBroadcast = async () => {
    if (!user) return;
    if (adminTitle.trim().length < 3 || adminMessage.trim().length < 10) {
      return toast.error("Title and message required");
    }
    // Insert as admin request, then auto-approve
    const { data: ins, error: e1 } = await supabase.from("notification_requests" as any).insert({
      submitted_by: user.id,
      submitter_role: "admin",
      audience_type: "all_learners",
      title: adminTitle.trim(),
      message: adminMessage.trim(),
      cta_link: adminCta.trim() || null,
      status: "pending",
    }).select("id").single();
    if (e1 || !ins) return toast.error(e1?.message || "Failed");
    const { data, error } = await supabase.rpc("approve_notification_request" as any, { _request_id: (ins as any).id });
    if (error) return toast.error(error.message);
    toast.success(`Broadcast sent to ${(data as any)?.recipients ?? 0} learners`);
    setAdminTitle(""); setAdminMessage(""); setAdminCta("");
    loadRequests();
  };

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    sent: requests.filter((r) => r.status === "sent").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    delivered: requests.reduce((s, r) => s + (r.recipients_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Notification Control Center</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Sent", value: stats.sent },
          { label: "Rejected", value: stats.rejected },
          { label: "Delivered", value: stats.delivered },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Approval Queue</TabsTrigger>
          <TabsTrigger value="broadcast">Direct Broadcast</TabsTrigger>
          <TabsTrigger value="permissions">Coach Permissions</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
          <TabsTrigger value="inactive">
            <MailWarning className="mr-1 h-4 w-4" /> Inactive User Reminder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-3">
          <div className="flex items-center gap-2">
            {["pending", "sent", "rejected", "cancelled", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}
              >
                {s}
              </button>
            ))}
          </div>

          {requests.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No requests.</div>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{r.submitter_role}</span>
                      <span className="text-xs font-medium text-foreground">{profileMap[r.submitted_by] || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">• {r.audience_type === "course" ? "Course" : "All learners"}</span>
                      <span className="text-xs text-muted-foreground">• {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase">{r.status}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.message}</p>
                    {r.cta_link && <p className="mt-1 text-xs text-primary truncate">CTA: {r.cta_link}</p>}
                    {r.status === "sent" && (
                      <p className="mt-2 text-xs text-green-500"><Users className="mr-1 inline h-3 w-3" /> Delivered to {r.recipients_count}</p>
                    )}
                    {r.status === "rejected" && r.reviewer_note && (
                      <p className="mt-2 text-xs text-destructive">Reason: {r.reviewer_note}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => approve(r.id)}>
                          <Check className="mr-1 h-3.5 w-3.5" /> Approve & Send
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRejectId(r.id); setRejectNote(""); }}>
                          <X className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteRequest(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {rejectId === r.id && (
                  <div className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3">
                    <Label>Rejection reason (optional)</Label>
                    <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={reject}>Confirm reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejectId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Send notification to all learners</h3>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={adminTitle} onChange={(e) => setAdminTitle(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} rows={4} maxLength={500} />
            </div>
            <div>
              <Label>CTA link (optional)</Label>
              <Input value={adminCta} onChange={(e) => setAdminCta(e.target.value)} placeholder="https://…" />
            </div>
            <Button onClick={sendAdminBroadcast}>
              <Send className="mr-2 h-4 w-4" /> Send now
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-2">
          <p className="text-xs text-muted-foreground">Block specific coaches from submitting notification requests.</p>
          {coaches.map((c) => {
            const p = perms.find((x) => x.coach_id === c.user_id);
            const blocked = !!p?.is_blocked;
            return (
              <div key={c.user_id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{blocked ? "Blocked" : "Allowed"}</span>
                  <Switch checked={!blocked} onCheckedChange={(v) => toggleCoachBlock(c.user_id, !v)} />
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="settings" className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Global notification system</p>
              <p className="text-xs text-muted-foreground">Master switch — when off, no notifications can be sent.</p>
            </div>
            <Switch checked={globalEnabled} onCheckedChange={(v) => toggleSetting("global_notifications_enabled", v)} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Coach-submitted notifications</p>
              <p className="text-xs text-muted-foreground">When off, coaches cannot submit requests. Admin direct sends still work.</p>
            </div>
            <Switch checked={coachEnabled} onCheckedChange={(v) => toggleSetting("coach_notifications_enabled", v)} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotificationCenter;
