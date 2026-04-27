import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CategoryRow {
  name: string;
  is_system: boolean;
  count: number;
}

const OTHERS = "Others";

const CoachCategoryCounts = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: cats }, { data: courses }] = await Promise.all([
      supabase.from("coach_categories").select("name, is_active, is_system").eq("is_active", true),
      supabase.from("courses").select("category").eq("coach_id", user.id),
    ]);

    const validNames = new Set((cats || []).map((c: any) => c.name.toLowerCase()));
    const counts: Record<string, number> = {};
    (courses || []).forEach((c: any) => {
      const raw = (c.category || "").trim();
      // Fallback: anything not matching active categories -> Others
      const name = raw && validNames.has(raw.toLowerCase()) ? raw : OTHERS;
      counts[name] = (counts[name] || 0) + 1;
    });

    const result: CategoryRow[] = (cats || [])
      .map((c: any) => ({ name: c.name, is_system: !!c.is_system, count: counts[c.name] || 0 }))
      .filter((r) => r.count > 0 || r.name === OTHERS)
      .sort((a, b) => (a.name === OTHERS ? 1 : b.name === OTHERS ? -1 : b.count - a.count));

    setRows(result);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;

    // Real-time updates on this coach's courses + category master changes
    const channel = supabase
      .channel(`coach-cat-counts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses", filter: `coach_id=eq.${user.id}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coach_categories" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return null;

  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Courses by Category</h3>
        </div>
        <span className="text-xs text-muted-foreground">Total: {total}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses yet.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-foreground truncate">{r.name}</span>
                {r.is_system && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">System</Badge>
                )}
              </div>
              <span className="text-sm font-semibold text-foreground">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachCategoryCounts;
