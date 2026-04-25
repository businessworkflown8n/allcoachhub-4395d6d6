import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Link as LinkIcon } from "lucide-react";

interface Material {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  external_link: string;
  category: string | null;
  created_at: string;
}

interface CoachInfo { user_id: string; full_name: string | null; }

const LearnerCoachMaterials = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Material[]>([]);
  const [coaches, setCoaches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      // RLS already restricts to coaches the learner is enrolled with
      const { data: mats } = await supabase
        .from("coach_materials")
        .select("id,coach_id,title,description,external_link,category,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      const list = (mats as Material[]) || [];
      setItems(list);

      const coachIds = Array.from(new Set(list.map((m) => m.coach_id)));
      if (coachIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,full_name")
          .in("user_id", coachIds);
        const map: Record<string, string> = {};
        (profs as CoachInfo[] | null)?.forEach((p) => { map[p.user_id] = p.full_name || "Coach"; });
        setCoaches(map);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          My Coach Materials
        </h2>
        <p className="text-sm text-muted-foreground">External resources shared by your coaches.</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LinkIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">No materials available yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your coaches haven't shared any external resources.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base text-foreground line-clamp-2">{m.title}</CardTitle>
                  {m.category && <Badge variant="secondary">{m.category}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">By {coaches[m.coach_id] || "Coach"}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {m.description && <p className="text-sm text-muted-foreground line-clamp-3">{m.description}</p>}
                <a
                  href={m.external_link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Link
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerCoachMaterials;
