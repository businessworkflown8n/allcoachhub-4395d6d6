import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CoachCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    if (!user) return;
    const { data } = await supabase.from("courses").select("*").eq("coach_id", user.id).order("created_at", { ascending: false });
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, [user]);

  const deleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Course deleted" });
      setCourses(courses.filter((c) => c.id !== id));
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("courses").update({ is_published: !current }).eq("id", id);
    setCourses(courses.map((c) => c.id === id ? { ...c, is_published: !current } : c));
    toast({ title: current ? "Course unpublished" : "Course published" });
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">My Courses</h2>
        <Link to="/coach/courses/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">
          <Plus className="h-4 w-4" /> Add Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No courses yet</h3>
          <p className="text-sm text-muted-foreground">Create your first course to start teaching</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary">{c.category}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${c.is_published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {c.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground">{c.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{c.level}</span> · <span>${Number(c.price_usd)}</span> · <span>₹{Number(c.price_inr)}</span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Link to={`/coach/courses/${c.id}/edit`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Edit className="h-3 w-3" /> Edit
                </Link>
                <button onClick={() => togglePublish(c.id, c.is_published)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  {c.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {c.is_published ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => deleteCourse(c.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive ml-auto">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachCourses;
