import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    const { data } = await supabase.from("reviews").select("*, courses(title)").order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const moderate = async (id: string, approved: boolean) => {
    await supabase.from("reviews").update({ is_approved: approved }).eq("id", id);
    setReviews(reviews.map((r) => r.id === id ? { ...r, is_approved: approved } : r));
    toast({ title: approved ? "Review approved" : "Review rejected" });
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Review Moderation</h2>
      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.is_approved ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {r.is_approved ? "Approved" : "Pending"}
                </span>
              </div>
              <p className="text-xs text-primary">{(r.courses as any)?.title}</p>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              <div className="flex gap-2 pt-2">
                {!r.is_approved && (
                  <button onClick={() => moderate(r.id, true)} className="flex items-center gap-1 rounded-lg bg-green-500/20 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/30">
                    <Check className="h-3 w-3" /> Approve
                  </button>
                )}
                {r.is_approved && (
                  <button onClick={() => moderate(r.id, false)} className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30">
                    <X className="h-3 w-3" /> Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
