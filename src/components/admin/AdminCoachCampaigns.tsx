import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { DollarSign, TrendingUp, Users, Zap, BarChart3, Eye, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

type CoachSummary = {
  coach_id: string;
  coach_name: string;
  total_spend: number;
  total_revenue: number;
  roas: number;
  campaign_count: number;
  top_platform: string;
};

const PLATFORMS = [
  { value: "all", label: "All Platforms" },
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "tiktok_ads", label: "TikTok Ads" },
  { value: "linkedin_ads", label: "LinkedIn Ads" },
  { value: "bing_ads", label: "Bing Ads" },
];

const AdminCoachCampaigns = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [drillCoach, setDrillCoach] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [metricsRes, profilesRes] = await Promise.all([
        supabase.from("campaign_metrics").select("*").order("date", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      if (metricsRes.data) setMetrics(metricsRes.data);
      if (profilesRes.data) {
        const map = new Map<string, string>();
        profilesRes.data.forEach((p: any) => map.set(p.user_id, p.full_name || "Unknown"));
        setProfiles(map);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    if (platformFilter === "all") return metrics;
    return metrics.filter(m => m.platform === platformFilter);
  }, [metrics, platformFilter]);

  const totals = useMemo(() => {
    const t = filtered.reduce((acc, m) => ({
      spend: acc.spend + Number(m.spend), revenue: acc.revenue + Number(m.revenue),
    }), { spend: 0, revenue: 0 });
    return { ...t, roas: t.spend > 0 ? t.revenue / t.spend : 0 };
  }, [filtered]);

  const coachSummaries = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number; campaigns: Set<string>; platforms: Map<string, number> }>();
    filtered.forEach(m => {
      const cur = map.get(m.coach_id) || { spend: 0, revenue: 0, campaigns: new Set<string>(), platforms: new Map<string, number>() };
      cur.spend += Number(m.spend);
      cur.revenue += Number(m.revenue);
      cur.campaigns.add(m.campaign_name);
      cur.platforms.set(m.platform, (cur.platforms.get(m.platform) || 0) + Number(m.revenue));
      map.set(m.coach_id, cur);
    });
    return Array.from(map.entries()).map(([id, d]) => {
      const topPlatform = Array.from(d.platforms.entries()).sort((a, b) => b[1] - a[1])[0];
      return {
        coach_id: id,
        coach_name: profiles.get(id) || "Unknown",
        total_spend: d.spend,
        total_revenue: d.revenue,
        roas: d.spend > 0 ? d.revenue / d.spend : 0,
        campaign_count: d.campaigns.size,
        top_platform: topPlatform ? (PLATFORMS.find(p => p.value === topPlatform[0])?.label || topPlatform[0]) : "-",
      };
    }).sort((a, b) => b.total_revenue - a.total_revenue);
  }, [filtered, profiles]);

  const chartData = coachSummaries.slice(0, 10).map(c => ({
    name: c.coach_name.split(" ")[0],
    spend: c.total_spend,
    revenue: c.total_revenue,
  }));

  const drillData = useMemo(() => {
    if (!drillCoach) return [];
    return filtered.filter(m => m.coach_id === drillCoach);
  }, [drillCoach, filtered]);

  const exportCSV = () => {
    const headers = ["Coach", "Spend", "Revenue", "ROAS", "Campaigns", "Top Platform"];
    const rows = coachSummaries.map(c => [c.coach_name, c.total_spend, c.total_revenue, c.roas.toFixed(1), c.campaign_count, c.top_platform]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `coach-performance-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (loading) return <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Coaches Campaign Performance</h2>
          <p className="text-muted-foreground text-sm mt-1">Cross-coach campaign analytics & comparison</p>
        </div>
        <div className="flex gap-2">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Spend</p><p className="text-2xl font-bold text-red-400">₹{totals.spend.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold text-green-400">₹{totals.revenue.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total ROAS</p><p className="text-2xl font-bold text-primary">{totals.roas.toFixed(1)}x</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Coaches</p><p className="text-2xl font-bold text-foreground">{coachSummaries.length}</p></CardContent></Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Coach Revenue vs Spend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 10%, 60%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 60%)" }} />
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8 }} />
                <Bar dataKey="spend" fill="hsl(0, 84%, 60%)" name="Spend" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="hsl(72, 100%, 50%)" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Coaches Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">Campaigns</TableHead>
                <TableHead>Top Platform</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coachSummaries.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No campaign data</TableCell></TableRow>
              )}
              {coachSummaries.map(c => (
                <TableRow key={c.coach_id}>
                  <TableCell className="font-medium">{c.coach_name}</TableCell>
                  <TableCell className="text-right">₹{c.total_spend.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right text-green-400">₹{c.total_revenue.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right">
                    <span className={c.roas >= 1 ? "text-green-400" : "text-red-400"}>{c.roas.toFixed(1)}x</span>
                  </TableCell>
                  <TableCell className="text-right">{c.campaign_count}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.top_platform}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setDrillCoach(c.coach_id)} className="gap-1">
                      <Eye className="h-3 w-3" /> Drill Down
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drill-Down Dialog */}
      <Dialog open={!!drillCoach} onOpenChange={() => setDrillCoach(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profiles.get(drillCoach || "") || "Coach"} — Campaign Details</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drillData.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium max-w-[150px] truncate">{m.campaign_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{PLATFORMS.find(p => p.value === m.platform)?.label || m.platform}</Badge></TableCell>
                  <TableCell className="text-xs">{m.date}</TableCell>
                  <TableCell className="text-right">₹{Number(m.spend).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right text-green-400">₹{Number(m.revenue).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right">{m.spend > 0 ? (Number(m.revenue) / Number(m.spend)).toFixed(1) : 0}x</TableCell>
                  <TableCell className="text-right">{m.clicks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoachCampaigns;
