import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Filter, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface CategoryRequest {
  id: string;
  coach_id: string;
  coach_name: string;
  coach_email: string;
  primary_category: string;
  requested_category: string;
  requested_category_icon: string | null;
  reason: string | null;
  status: string;
  admin_response_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  linked_courses: { id: string; title: string; category: string }[];
}

const AdminCategoryRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    setLoading(true);

    let query = supabase
      .from("coach_category_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: reqs } = await query;

    if (!reqs || reqs.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Get coach profiles
    const coachIds = [...new Set(reqs.map((r: any) => r.coach_id))];
    const categoryIds = [...new Set(reqs.map((r: any) => r.requested_category_id))];
    const reqIds = reqs.map((r: any) => r.id);

    const [profilesRes, categoriesRes, permissionsRes, coursesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email").in("user_id", coachIds),
      supabase.from("coach_categories").select("id, name, icon").in("id", categoryIds),
      supabase
        .from("coach_category_permissions")
        .select("coach_id, category_id, is_primary")
        .in("coach_id", coachIds)
        .eq("is_primary", true),
      // Fetch courses linked to these category requests
      supabase
        .from("courses")
        .select("id, title, category, category_request_id")
        .in("category_request_id", reqIds),
    ]);

    const profileMap: Record<string, any> = {};
    (profilesRes.data || []).forEach((p: any) => { profileMap[p.user_id] = p; });

    const catMap: Record<string, any> = {};
    (categoriesRes.data || []).forEach((c: any) => { catMap[c.id] = c; });

    // Build course map by category_request_id
    const coursesByReqId: Record<string, { id: string; title: string; category: string }[]> = {};
    (coursesRes.data || []).forEach((c: any) => {
      if (!coursesByReqId[c.category_request_id]) coursesByReqId[c.category_request_id] = [];
      coursesByReqId[c.category_request_id].push({ id: c.id, title: c.title, category: c.category });
    });

    // Get primary category names
    const primaryCatIds = [...new Set((permissionsRes.data || []).map((p: any) => p.category_id))];
    let primaryCatMap: Record<string, string> = {};
    if (primaryCatIds.length > 0) {
      const { data: primaryCats } = await supabase.from("coach_categories").select("id, name").in("id", primaryCatIds);
      (primaryCats || []).forEach((c: any) => { primaryCatMap[c.id] = c.name; });
    }

    const coachPrimaryMap: Record<string, string> = {};
    (permissionsRes.data || []).forEach((p: any) => {
      coachPrimaryMap[p.coach_id] = primaryCatMap[p.category_id] || "Unknown";
    });

    const mapped = reqs.map((r: any) => ({
      id: r.id,
      coach_id: r.coach_id,
      coach_name: profileMap[r.coach_id]?.full_name || "Unknown",
      coach_email: profileMap[r.coach_id]?.email || "",
      primary_category: coachPrimaryMap[r.coach_id] || "—",
      requested_category: catMap[r.requested_category_id]?.name || "Unknown",
      requested_category_icon: catMap[r.requested_category_id]?.icon || null,
      reason: r.reason,
      status: r.status,
      admin_response_note: r.admin_response_note,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
      linked_courses: coursesByReqId[r.id] || [],
    }));

    setRequests(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const handleAction = async (req: CategoryRequest, action: "approved" | "rejected") => {
    const note = responseNotes[req.id] || null;

    // Update request status
    const { error: reqError } = await supabase
      .from("coach_category_requests")
      .update({
        status: action,
        admin_response_note: note,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", req.id);

    if (reqError) {
      toast({ title: "Error", description: reqError.message, variant: "destructive" });
      return;
    }

    // If approved, create permission
    if (action === "approved") {
      // Get category_id from the request
      const { data: reqData } = await supabase
        .from("coach_category_requests")
        .select("requested_category_id")
        .eq("id", req.id)
        .single();

      if (reqData) {
        await supabase.from("coach_category_permissions").upsert({
          coach_id: req.coach_id,
          category_id: reqData.requested_category_id,
          is_primary: false,
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        }, { onConflict: "coach_id,category_id" });

        // Update linked courses: clear the pending flag so coach can publish
        if (req.linked_courses.length > 0) {
          const courseIds = req.linked_courses.map((c) => c.id);
          await supabase
            .from("courses")
            .update({ requires_category_approval: false })
            .in("id", courseIds);
        }
      }

      // Send approval email to coach
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        await fetch(`${supabaseUrl}/functions/v1/notify-category-approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coach_id: req.coach_id,
            coach_name: req.coach_name,
            coach_email: req.coach_email,
            category_name: req.requested_category,
            course_titles: req.linked_courses.map((c) => c.title),
          }),
        });
      } catch (err) {
        console.error("Email notification error:", err);
      }
    }

    toast({ title: action === "approved" ? "Request Approved" : "Request Rejected" });
    fetchRequests();
  };

  const filtered = requests.filter(
    (r) =>
      r.coach_name.toLowerCase().includes(search.toLowerCase()) ||
      r.coach_email.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || ""}`}>
        {status === "pending" && <Clock className="h-3 w-3" />}
        {status === "approved" && <CheckCircle className="h-3 w-3" />}
        {status === "rejected" && <XCircle className="h-3 w-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Coach Category Requests</h2>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Search by coach name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-secondary border-border"
        />
      </div>

      {loading ? (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No category requests found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{req.coach_name}</p>
                  <p className="text-xs text-muted-foreground">{req.coach_email}</p>
                </div>
                {statusBadge(req.status)}
              </div>

              <div className="grid gap-2 text-xs sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">Primary Category:</span>
                  <p className="font-medium text-foreground">{req.primary_category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Requested Category:</span>
                  <p className="font-medium text-foreground">
                    {req.requested_category_icon} {req.requested_category}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Requested:</span>
                  <p className="font-medium text-foreground">{format(new Date(req.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>

              {/* Linked Courses */}
              {req.linked_courses.length > 0 && (
                <div className="rounded-lg bg-secondary/50 border border-border p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Associated Course(s):
                  </p>
                  <div className="space-y-1">
                    {req.linked_courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{course.title}</span>
                        <span className="text-muted-foreground">{course.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {req.reason && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Reason:</span>
                  <p className="text-foreground mt-0.5">{req.reason}</p>
                </div>
              )}

              {req.admin_response_note && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Admin Note:</span>
                  <p className="text-foreground mt-0.5">{req.admin_response_note}</p>
                </div>
              )}

              {req.status === "pending" && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Textarea
                    placeholder="Add a note (optional)..."
                    value={responseNotes[req.id] || ""}
                    onChange={(e) => setResponseNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    rows={2}
                    className="bg-secondary border-border text-xs resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req, "approved")}
                      className="gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(req, "rejected")}
                      className="gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCategoryRequests;
