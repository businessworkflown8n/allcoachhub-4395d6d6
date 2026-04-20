import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Search } from "lucide-react";

interface Row {
  coach_id: string; full_name: string; email: string;
  plan_id: string | null; bundle_id: string | null; status: string;
}
interface Plan { id: string; name: string; }
interface Bundle { id: string; name: string; plan_id: string | null; }

const AdminCoachSubscriptions = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: subs }, { data: p }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email"),
      supabase.from("user_roles").select("user_id").eq("role", "coach"),
      supabase.from("coach_subscriptions").select("*"),
      supabase.from("subscription_plans").select("id,name").eq("is_active", true).order("sort_order"),
      supabase.from("feature_bundles").select("id,name,plan_id").eq("is_active", true).order("sort_order"),
    ]);
    const coachIds = new Set((roles || []).map((r) => r.user_id));
    const subMap = new Map((subs || []).map((s: any) => [s.coach_id, s]));
    const list: Row[] = (profiles || []).filter((pr) => coachIds.has(pr.user_id)).map((pr) => {
      const s: any = subMap.get(pr.user_id);
      return {
        coach_id: pr.user_id, full_name: pr.full_name || "Unknown", email: pr.email || "",
        plan_id: s?.plan_id || null, bundle_id: s?.bundle_id || null, status: s?.status || "—",
      };
    });
    setRows(list);
    setPlans((p as any) || []); setBundles((b as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const upsert = async (coach_id: string, patch: Partial<Row>) => {
    const { data: existing } = await supabase.from("coach_subscriptions").select("id").eq("coach_id", coach_id).maybeSingle();
    const updates: any = { ...patch };
    if (patch.plan_id !== undefined) updates.plan_id = patch.plan_id || null;
    if (patch.bundle_id !== undefined) updates.bundle_id = patch.bundle_id || null;
    if (existing) await supabase.from("coach_subscriptions").update(updates).eq("coach_id", coach_id);
    else await supabase.from("coach_subscriptions").insert({ coach_id, status: "active", ...updates });
    setRows((prev) => prev.map((r) => r.coach_id === coach_id ? { ...r, ...patch } : r));
    toast({ title: "Subscription updated" });
  };

  const filtered = rows.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Coach Subscriptions</h2>
          <p className="text-sm text-muted-foreground">Assign each coach a plan + bundle. Bundle defaults apply automatically; manual toggles in Feature Control override them.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <CardTitle className="text-foreground">Coaches</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground py-6 text-center">Loading...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Coach</TableHead><TableHead>Plan</TableHead><TableHead>Bundle</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const eligibleBundles = bundles.filter((b) => !r.plan_id || !b.plan_id || b.plan_id === r.plan_id);
                    return (
                      <TableRow key={r.coach_id}>
                        <TableCell><div><p className="font-medium text-foreground">{r.full_name}</p><p className="text-xs text-muted-foreground">{r.email}</p></div></TableCell>
                        <TableCell>
                          <Select value={r.plan_id || "none"} onValueChange={(v) => upsert(r.coach_id, { plan_id: v === "none" ? null : v })}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="No plan" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">No plan</SelectItem>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={r.bundle_id || "none"} onValueChange={(v) => upsert(r.coach_id, { bundle_id: v === "none" ? null : v })}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="No bundle" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">No bundle</SelectItem>{eligibleBundles.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={r.status === "—" ? "active" : r.status} onValueChange={(v) => upsert(r.coach_id, { status: v })}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="trialing">Trialing</SelectItem>
                              <SelectItem value="canceled">Canceled</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No coaches</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoachSubscriptions;
