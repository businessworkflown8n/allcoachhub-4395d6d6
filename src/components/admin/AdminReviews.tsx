import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Check, X, Trash2, Search, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });
    const reviewList = data || [];
    setReviews(reviewList);

    // Fetch profiles for learner and coach names
    const ids = new Set<string>();
    reviewList.forEach((r: any) => {
      if (r.learner_id) ids.add(r.learner_id);
      if (r.coach_id) ids.add(r.coach_id);
    });
    if (ids.size > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", Array.from(ids));
      const map: Record<string, any> = {};
      (profileData || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const moderate = async (id: string, status: string) => {
    await supabase.from("reviews").update({ status, is_approved: status === "approved" }).eq("id", id);
    setReviews(reviews.map((r) => r.id === id ? { ...r, status, is_approved: status === "approved" } : r));
    toast({ title: status === "approved" ? "Review approved" : "Review rejected" });
  };

  const deleteReview = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    setReviews(reviews.filter((r) => r.id !== id));
    toast({ title: "Review deleted" });
  };

  const filtered = reviews.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) return false;
    if (search) {
      const learnerName = profiles[r.learner_id]?.full_name || "";
      const coachName = profiles[r.coach_id]?.full_name || "";
      const q = search.toLowerCase();
      if (!learnerName.toLowerCase().includes(q) && !coachName.toLowerCase().includes(q) && !(r.comment || "").toLowerCase().includes(q) && !(r.review_text || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalReviews = reviews.length;
  const approved = reviews.filter(r => r.status === "approved").length;
  const pending = reviews.filter(r => r.status === "pending").length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : "0.0";

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-500/20 text-green-400 border-0">Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Review & Rating Management</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: totalReviews, color: "text-primary" },
          { label: "Approved", value: approved, color: "text-green-400" },
          { label: "Pending", value: pending, color: "text-yellow-400" },
          { label: "Avg Rating", value: `${avgRating} ★`, color: "text-primary" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or text..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[130px]"><Star className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5,4,3,2,1].map(n => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No reviews found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Learner</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{profiles[r.learner_id]?.full_name || "—"}</TableCell>
                <TableCell>{profiles[r.coach_id]?.full_name || "—"}</TableCell>
                <TableCell className="text-xs text-primary">{(r.courses as any)?.title || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{r.review_text || r.comment || "—"}</TableCell>
                <TableCell>{statusBadge(r.status || (r.is_approved ? "approved" : "pending"))}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {(r.status || (r.is_approved ? "approved" : "pending")) !== "approved" && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400 hover:text-green-300" onClick={() => moderate(r.id, "approved")}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(r.status || (r.is_approved ? "approved" : "pending")) !== "rejected" && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-yellow-400 hover:text-yellow-300" onClick={() => moderate(r.id, "rejected")}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => deleteReview(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminReviews;
