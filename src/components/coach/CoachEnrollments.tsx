import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

const CoachEnrollments = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("enrollments").select("*, courses(title)").eq("coach_id", user.id).order("enrolled_at", { ascending: false }).then(({ data }) => {
      setEnrollments(data || []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  const totalEnrollments = enrollments.length;
  const countries = [...new Set(enrollments.map((e) => e.country))];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Enrollment Analytics</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalEnrollments}</p>
          <p className="text-xs text-muted-foreground">Total Enrollments</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{countries.length}</p>
          <p className="text-xs text-muted-foreground">Countries</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{enrollments.filter((e) => e.payment_status === "paid").length}</p>
          <p className="text-xs text-muted-foreground">Paid Enrollments</p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No enrollments yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-foreground">{e.full_name}</TableCell>
                  <TableCell className="text-foreground">{(e.courses as any)?.title}</TableCell>
                  <TableCell className="text-muted-foreground">{e.country}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.payment_status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{e.payment_status}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CoachEnrollments;
