import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationPermissions } from "@/hooks/useNotificationPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Clock, Check, X, Ban, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface NotifRequest {
  id: string;
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

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  approved: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  sent: "bg-green-500/15 text-green-500 border-green-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const CoachNotificationRequests = () => {
  const { user } = useAuth();
  const perms = useNotificationPermissions();
  const [requests, setRequests] = useState<NotifRequest[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [audience, setAudience] = useState<"all_learners" | "course">("all_learners");
  const [courseId, setCourseId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notification_requests" as any)
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests((data as any) || []);
  };

  const fetchCourses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .eq("coach_id", user.id);
    setCourses((data as any) || []);
  };

  useEffect(() => {
    fetchRequests();
    fetchCourses();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (title.trim().length < 3) return toast.error("Title too short");
    if (message.trim().length < 10) return toast.error("Message must be at least 10 characters");
    if (audience === "course" && !courseId) return toast.error("Select a course");

    setSubmitting(true);
    const { error } = await supabase.from("notification_requests" as any).insert({
      submitted_by: user.id,
      submitter_role: "coach",
      audience_type: audience,
      course_id: audience === "course" ? courseId : null,
      title: title.trim(),
      message: message.trim(),
      cta_link: ctaLink.trim() || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Submitted for admin approval");
    setTitle(""); setMessage(""); setCtaLink(""); setAudience("all_learners"); setCourseId("");
    fetchRequests();
  };

  const cancelRequest = async (id: string) => {
    const { error } = await supabase
      .from("notification_requests" as any)
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cancelled");
    fetchRequests();
  };

  if (perms.loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-muted" />;
  }

  if (!perms.globalEnabled || !perms.coachEnabled) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Ban className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-3 text-base font-semibold text-foreground">Notifications are currently disabled</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The platform admin has turned off coach notifications. Please check back later.
        </p>
      </div>
    );
  }

  if (perms.isBlocked) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h3 className="mt-3 text-base font-semibold text-foreground">You cannot submit notifications</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your access to send notifications has been restricted by an admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Notification Requests</h2>
      </div>

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground">Submit a notification (admin will review)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_learners">All learners</SelectItem>
                <SelectItem value="course">Specific course</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {audience === "course" && (
            <div>
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. New live session this Friday" />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={500} placeholder="Tell learners what's happening…" />
          <p className="mt-1 text-xs text-muted-foreground">{message.length}/500</p>
        </div>
        <div>
          <Label>CTA link (optional)</Label>
          <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="https://…" />
        </div>
        <Button type="submit" disabled={submitting}>
          <Send className="mr-2 h-4 w-4" />
          {submitting ? "Submitting…" : "Submit for approval"}
        </Button>
      </form>

      {/* List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Your submissions</h3>
        {requests.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No requests yet.</div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadge[r.status] || "border-border"}`}>
                      {r.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.audience_type === "course" ? "Course" : "All learners"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.message}</p>
                  {r.status === "sent" && (
                    <p className="mt-2 text-xs text-green-500">
                      <Check className="mr-1 inline h-3 w-3" /> Delivered to {r.recipients_count} learners
                    </p>
                  )}
                  {r.status === "rejected" && r.reviewer_note && (
                    <p className="mt-2 text-xs text-destructive">Reason: {r.reviewer_note}</p>
                  )}
                </div>
                {r.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => cancelRequest(r.id)}>
                    <X className="mr-1 h-3 w-3" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CoachNotificationRequests;
