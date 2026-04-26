import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";

type Submission = {
  id: string;
  user_id: string | null;
  user_type: "coach" | "learner";
  signup_method: string;
  email: string;
  form_data: Record<string, unknown>;
  field_count: number;
  source_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  created_at: string;
};

const AdminSignupSubmissions = () => {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "coach" | "learner">("all");
  const [selected, setSelected] = useState<Submission | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("signup_submissions").select("*").order("created_at", { ascending: false }).limit(500);
    if (filterType !== "all") q = q.eq("user_type", filterType);
    const { data, error } = await q;
    if (!error && data) setRows(data as unknown as Submission[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType]);

  const filtered = rows.filter((r) =>
    !search ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify(r.form_data).toLowerCase().includes(search.toLowerCase())
  );

  const exportCsv = () => {
    const headers = ["Date", "Type", "Email", "Field Count", "UTM Source", "UTM Campaign", "Form Data"];
    const rowsCsv = filtered.map((r) => [
      format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
      r.user_type,
      r.email,
      String(r.field_count),
      r.utm_source ?? "",
      r.utm_campaign ?? "",
      JSON.stringify(r.form_data).replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rowsCsv].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `signup-submissions-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Signup Submissions</h2>
          <p className="text-sm text-muted-foreground">Full form payloads captured from email signups (additive layer).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or any field..." className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="coach">Coaches</SelectItem>
              <SelectItem value="learner">Learners</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Submissions ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signup submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Fields</th>
                    <th className="py-2 pr-3">UTM Source</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="py-2 pr-3">{format(new Date(r.created_at), "MMM d, yyyy HH:mm")}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={r.user_type === "coach" ? "default" : "secondary"}>{r.user_type}</Badge>
                      </td>
                      <td className="py-2 pr-3 font-medium text-foreground">{r.email}</td>
                      <td className="py-2 pr-3">{r.field_count}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.utm_source ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submission Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.email}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <Badge>{selected.user_type}</Badge></div>
                <div><span className="text-muted-foreground">Date:</span> {format(new Date(selected.created_at), "PPpp")}</div>
                <div><span className="text-muted-foreground">Fields:</span> {selected.field_count}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Source:</span> <span className="break-all">{selected.source_url ?? "—"}</span></div>
                <div><span className="text-muted-foreground">UTM Source:</span> {selected.utm_source ?? "—"}</div>
                <div><span className="text-muted-foreground">UTM Campaign:</span> {selected.utm_campaign ?? "—"}</div>
              </div>
              <div>
                <p className="mb-2 font-semibold text-foreground">Captured Form Data</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                  {Object.entries(selected.form_data).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="col-span-2 break-all text-foreground">{v ? String(v) : <em className="text-muted-foreground">empty</em>}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 font-semibold text-foreground">Raw JSON</p>
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-xs">{JSON.stringify(selected.form_data, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSignupSubmissions;
