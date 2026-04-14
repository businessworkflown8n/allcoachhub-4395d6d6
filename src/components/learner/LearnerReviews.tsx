import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star, Edit2, Trash2, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const StarSelector = ({ rating, onChange, size = "h-6 w-6" }: { rating: number; onChange: (r: number) => void; size?: string }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} className="transition-transform hover:scale-110">
        <Star className={`${size} ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground/30 hover:text-primary/50"}`} />
      </button>
    ))}
  </div>
);

const LearnerReviews = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formCourseId, setFormCourseId] = useState("");
  const [formCoachId, setFormCoachId] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const enrRes: any = await supabase.from("enrollments").select("*, courses(id, title, coach_id)").eq("user_id", user.id);
    const revRes: any = await supabase.from("reviews").select("*, courses(title)").eq("learner_id", user.id).order("created_at", { ascending: false });
    setEnrollments(enrRes.data || []);
    setReviews(revRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const openNew = (courseId: string, coachId: string) => {
    setEditId(null);
    setFormCourseId(courseId);
    setFormCoachId(coachId);
    setFormRating(0);
    setFormText("");
    setDialogOpen(true);
  };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setFormCourseId(r.course_id);
    setFormCoachId(r.coach_id);
    setFormRating(r.rating);
    setFormText(r.review_text || r.comment || "");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (formRating < 1) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
    if (formText.trim().length < 20) { toast({ title: "Review must be at least 20 characters", variant: "destructive" }); return; }

    setSubmitting(true);
    if (editId) {
      const { error } = await supabase.from("reviews").update({
        rating: formRating, review_text: formText.trim(), comment: formText.trim(), status: "pending", is_approved: false,
      }).eq("id", editId);
      if (error) { toast({ title: "Failed to update review", variant: "destructive" }); }
      else { toast({ title: "Review updated – pending approval" }); }
    } else {
      const { error } = await supabase.from("reviews").insert({
        learner_id: user.id, coach_id: formCoachId, course_id: formCourseId,
        rating: formRating, review_text: formText.trim(), comment: formText.trim(), status: "pending", is_approved: false,
      });
      if (error) {
        if (error.code === "23505") toast({ title: "You already reviewed this course", variant: "destructive" });
        else toast({ title: "Failed to submit review", variant: "destructive" });
      } else { toast({ title: "Review submitted – pending approval" }); }
    }
    setSubmitting(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    toast({ title: "Review deleted" });
    fetchData();
  };

  const reviewedCourseIds = new Set(reviews.map(r => r.course_id));

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Rejected</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">Pending</Badge>;
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">My Reviews</h2>

      {/* Existing Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium text-primary">{(r.courses as any)?.title || "Course"}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      {statusBadge(r.status || (r.is_approved ? "approved" : "pending"))}
                    </div>
                    <p className="text-sm text-muted-foreground">{r.review_text || r.comment}</p>
                    <p className="text-xs text-muted-foreground/60">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(r)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Courses available for review */}
      <Card>
        <CardHeader><CardTitle className="text-base">Write a Review</CardTitle></CardHeader>
        <CardContent>
          {enrollments.filter(e => !reviewedCourseIds.has((e.courses as any)?.id)).length === 0 ? (
            <p className="text-sm text-muted-foreground">All enrolled courses have been reviewed.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.filter(e => !reviewedCourseIds.has((e.courses as any)?.id)).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{(e.courses as any)?.title}</p>
                  <Button size="sm" onClick={() => openNew((e.courses as any)?.id, (e.courses as any)?.coach_id)}>
                    <Star className="h-3.5 w-3.5 mr-1" /> Write Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Review" : "Write a Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
              <StarSelector rating={formRating} onChange={setFormRating} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Review (min 20 chars)</p>
              <Textarea value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="Share your experience..." rows={4} />
              <p className="text-xs text-muted-foreground mt-1">{formText.length}/20 min characters</p>
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              <Send className="h-4 w-4 mr-2" /> {editId ? "Update Review" : "Submit Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearnerReviews;
