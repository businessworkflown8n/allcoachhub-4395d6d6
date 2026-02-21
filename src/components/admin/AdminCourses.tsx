import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

const AdminCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const [courseData, enrollData, profileData] = await Promise.all([
        supabase.from("courses").select("*").order("created_at", { ascending: false }),
        supabase.from("enrollments").select("course_id, id"),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      setCourses(courseData.data || []);
      setEnrollments(enrollData.data || []);
      setProfiles(profileData.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const getCoachName = (coachId: string) => profiles.find((p) => p.user_id === coachId)?.full_name || "—";
  const getEnrollmentCount = (courseId: string) => enrollments.filter((e) => e.course_id === courseId).length;

  const filtered = courses.filter((c) =>
    !search || [c.title, c.category, getCoachName(c.coach_id)].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">All Courses</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border w-56" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No courses found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Price (USD)</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-foreground font-medium max-w-[200px] truncate">{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{getCoachName(c.coach_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{c.category}</TableCell>
                  <TableCell className="text-muted-foreground">{c.level}</TableCell>
                  <TableCell className="text-foreground">${c.price_usd}</TableCell>
                  <TableCell className="text-foreground">{getEnrollmentCount(c.id)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.is_published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {c.is_published ? "Published" : "Draft"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
