import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Award, Download } from "lucide-react";

const LearnerCertificates = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("enrollments").select("*, courses(title)").eq("learner_id", user.id).not("certificate_url", "is", null).then(({ data }) => {
      setEnrollments(data || []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Certificates</h2>
      {enrollments.length === 0 ? (
        <div className="text-center py-16">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No certificates yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Complete a course to earn your certificate</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Award className="h-8 w-8 text-primary" />
              <h3 className="text-sm font-bold text-foreground">{(e.courses as any)?.title}</h3>
              <p className="text-xs text-muted-foreground">Completed {e.completed_at ? new Date(e.completed_at).toLocaleDateString() : ""}</p>
              <a href={e.certificate_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Download className="h-4 w-4" /> Download Certificate
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerCertificates;
