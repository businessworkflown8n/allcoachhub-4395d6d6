import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Shield, AlertTriangle, CheckCircle, Clock, Ban, MessageSquare, FileText, Users } from "lucide-react";
import { toast } from "sonner";

const ModeratorPanel = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const stats = {
    total: reports.length,
    open: reports.filter(r => r.status === "open").length,
    resolved: reports.filter(r => r.status === "resolved").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
  };

  useEffect(() => {
    const load = async () => {
      const query = supabase.from("community_reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query.eq("status", filter);
      const { data } = await query;
      setReports(data || []);
      setLoading(false);
    };
    load();
  }, [filter]);

  const resolveReport = async (reportId: string, status: "resolved" | "dismissed") => {
    const { error } = await supabase.from("community_reports").update({
      status, resolved_at: new Date().toISOString(),
      resolution_note: resolutionNotes[reportId] || null,
    }).eq("id", reportId);
    if (error) { toast.error("Failed to update report"); return; }
    toast.success(`Report ${status}`);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  };

  const statusColors: Record<string, string> = {
    open: "bg-yellow-500/20 text-yellow-400",
    resolved: "bg-green-500/20 text-green-400",
    dismissed: "bg-muted text-muted-foreground",
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Moderator Panel</h2>
        <p className="text-sm text-muted-foreground">Review reported content and manage community moderation.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Reports", value: stats.total, icon: FileText, color: "text-foreground" },
          { label: "Open", value: stats.open, icon: AlertTriangle, color: "text-yellow-400" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "text-green-400" },
          { label: "Dismissed", value: stats.dismissed, icon: Ban, color: "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "open", "resolved", "dismissed"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>

      {/* Reports */}
      {reports.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No reports found.</CardContent></Card>}

      <div className="space-y-3">
        {reports.map(report => (
          <Card key={report.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs capitalize">{report.target_type}</Badge>
                    <Badge className={`text-xs border-0 capitalize ${statusColors[report.status] || ""}`}>{report.status}</Badge>
                  </div>
                  <p className="font-medium text-foreground">{report.reason}</p>
                  {report.details && <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Reported {new Date(report.created_at).toLocaleDateString()}</p>
                  {report.resolution_note && <p className="mt-1 text-xs text-muted-foreground italic">Note: {report.resolution_note}</p>}
                </div>
                {report.status === "open" && (
                  <div className="flex flex-col gap-2 sm:w-48">
                    <Textarea placeholder="Resolution note..." rows={2} className="text-xs"
                      value={resolutionNotes[report.id] || ""}
                      onChange={e => setResolutionNotes(prev => ({ ...prev, [report.id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => resolveReport(report.id, "resolved")}>Resolve</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => resolveReport(report.id, "dismissed")}>Dismiss</Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModeratorPanel;
