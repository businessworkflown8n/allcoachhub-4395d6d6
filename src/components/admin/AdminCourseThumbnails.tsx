import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageIcon, CheckCircle, XCircle, Eye, Search, Loader2, Clock, ShieldCheck, ShieldX } from "lucide-react";
import { format } from "date-fns";

type ThumbnailStatus = "all" | "pending" | "approved" | "rejected";

interface CourseThumb {
  id: string;
  title: string;
  thumbnail_url: string | null;
  thumbnail_status: string;
  thumbnail_approved_at: string | null;
  updated_at: string;
  coach_id: string;
  coach_name: string;
}

const AdminCourseThumbnails = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseThumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ThumbnailStatus>("pending");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, title, thumbnail_url, thumbnail_status, thumbnail_approved_at, updated_at, coach_id")
      .not("thumbnail_url", "is", null)
      .order("updated_at", { ascending: false });

    if (!coursesData?.length) { setCourses([]); setLoading(false); return; }

    const coachIds = [...new Set(coursesData.map(c => c.coach_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", coachIds);

    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name || "Unknown"]));

    const mapped: CourseThumb[] = coursesData.map(c => ({
      ...c,
      thumbnail_status: c.thumbnail_status || "pending",
      coach_name: nameMap.get(c.coach_id) || "Unknown",
    }));

    setCourses(mapped);
    setStats({
      total: mapped.length,
      pending: mapped.filter(c => c.thumbnail_status === "pending").length,
      approved: mapped.filter(c => c.thumbnail_status === "approved").length,
      rejected: mapped.filter(c => c.thumbnail_status === "rejected").length,
    });
    setLoading(false);
  };

  const updateStatus = async (courseId: string, status: "approved" | "rejected") => {
    if (!user) return;
    setActing(courseId);
    const updateData: any = { thumbnail_status: status };
    if (status === "approved") {
      updateData.thumbnail_approved_by = user.id;
      updateData.thumbnail_approved_at = new Date().toISOString();
    } else {
      updateData.thumbnail_approved_by = null;
      updateData.thumbnail_approved_at = null;
    }

    const { error } = await supabase.from("courses").update(updateData).eq("id", courseId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? "Thumbnail approved" : "Thumbnail rejected" });
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, thumbnail_status: status } : c));
      setStats(prev => {
        const old = courses.find(c => c.id === courseId)?.thumbnail_status || "pending";
        return {
          ...prev,
          [old]: prev[old as keyof typeof prev] - 1,
          [status]: prev[status as keyof typeof prev] + 1,
        };
      });
    }
    setActing(null);
  };

  const filtered = courses.filter(c => {
    if (filter !== "all" && c.thumbnail_status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.coach_name.toLowerCase().includes(q);
    }
    return true;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-500/15 text-green-500"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-destructive/15 text-destructive"><XCircle className="h-3 w-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-500/15 text-yellow-500"><Clock className="h-3 w-3" /> Pending</span>;
    }
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ImageIcon className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Course Thumbnail Approval</h2>
          <p className="text-sm text-muted-foreground">Review and approve coach-uploaded course thumbnails before they go live.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Uploads", value: stats.total, icon: ImageIcon, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500" },
          { label: "Approved", value: stats.approved, icon: ShieldCheck, color: "text-green-500" },
          { label: "Rejected", value: stats.rejected, icon: ShieldX, color: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search course or coach..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "approved", "rejected"] as ThumbnailStatus[]).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize text-xs">
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <button onClick={() => setPreviewUrl(c.thumbnail_url)} className="block rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary/40 transition-all">
                    <img src={c.thumbnail_url || ""} alt={c.title} className="w-20 h-12 object-cover" />
                  </button>
                </TableCell>
                <TableCell className="font-medium text-foreground max-w-[200px] truncate">{c.title}</TableCell>
                <TableCell className="text-muted-foreground">{c.coach_name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{format(new Date(c.updated_at), "MMM d, yyyy")}</TableCell>
                <TableCell>{statusBadge(c.thumbnail_status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setPreviewUrl(c.thumbnail_url)} className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {acting === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <>
                        {c.thumbnail_status !== "approved" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "approved")} className="h-8 gap-1 text-xs text-green-500 border-green-500/30 hover:bg-green-500/10">
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </Button>
                        )}
                        {c.thumbnail_status !== "rejected" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "rejected")} className="h-8 gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No thumbnails found for this filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={o => { if (!o) setPreviewUrl(null); }}>
        <DialogContent className="max-w-2xl p-2">
          {previewUrl && <img src={previewUrl} alt="Thumbnail preview" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourseThumbnails;
