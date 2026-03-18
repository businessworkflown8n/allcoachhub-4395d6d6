import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DollarSign, TrendingUp, MousePointerClick, Eye, Target, BarChart3,
  FileText, Download, Share2, Plus, Filter, ArrowUpRight, ArrowDownRight,
  Zap, Plug
} from "lucide-react";
import CoachPlatformSelector from "./CoachPlatformSelector";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

type CampaignMetric = {
  id: string;
  platform: string;
  campaign_name: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  leads: number;
  cpc: number;
  ctr: number;
  roas: number;
  cpa: number;
  add_to_cart: number;
  checkouts: number;
  purchases: number;
  source: string;
};

const PLATFORMS = [
  { value: "all", label: "All Platforms" },
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "tiktok_ads", label: "TikTok Ads" },
  { value: "linkedin_ads", label: "LinkedIn Ads" },
  { value: "bing_ads", label: "Bing Ads" },
];

const CHART_COLORS = [
  "hsl(72, 100%, 50%)", "hsl(200, 80%, 55%)", "hsl(340, 80%, 55%)",
  "hsl(270, 70%, 60%)", "hsl(30, 90%, 55%)"
];

const CoachCampaignInsights = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareForm, setShareForm] = useState({ name: "", email: "", role: "viewer" });
  const [newMetric, setNewMetric] = useState({
    platform: "google_ads", campaign_name: "", date: format(new Date(), "yyyy-MM-dd"),
    spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, leads: 0,
    add_to_cart: 0, checkouts: 0, purchases: 0,
  });

  useEffect(() => {
    if (!user) return;
    const fetchMetrics = async () => {
      const { data, error } = await supabase
        .from("campaign_metrics")
        .select("*")
        .eq("coach_id", user.id)
        .order("date", { ascending: false });
      if (data) setMetrics(data as unknown as CampaignMetric[]);
      if (error) console.error(error);
      setLoading(false);
    };
    fetchMetrics();
  }, [user]);

  const filtered = useMemo(() => {
    let data = metrics;
    if (platformFilter !== "all") data = data.filter(m => m.platform === platformFilter);
    if (dateFrom) data = data.filter(m => m.date >= dateFrom);
    if (dateTo) data = data.filter(m => m.date <= dateTo);
    return data;
  }, [metrics, platformFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const t = filtered.reduce((acc, m) => ({
      spend: acc.spend + Number(m.spend),
      revenue: acc.revenue + Number(m.revenue),
      clicks: acc.clicks + Number(m.clicks),
      impressions: acc.impressions + Number(m.impressions),
      conversions: acc.conversions + Number(m.conversions),
      leads: acc.leads + Number(m.leads),
    }), { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0, leads: 0 });
    return {
      ...t,
      roas: t.spend > 0 ? t.revenue / t.spend : 0,
      cpa: t.conversions > 0 ? t.spend / t.conversions : 0,
      ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
      cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
    };
  }, [filtered]);

  const platformBreakdown = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number; clicks: number; conversions: number }>();
    filtered.forEach(m => {
      const cur = map.get(m.platform) || { spend: 0, revenue: 0, clicks: 0, conversions: 0 };
      map.set(m.platform, {
        spend: cur.spend + Number(m.spend),
        revenue: cur.revenue + Number(m.revenue),
        clicks: cur.clicks + Number(m.clicks),
        conversions: cur.conversions + Number(m.conversions),
      });
    });
    return Array.from(map.entries()).map(([platform, data]) => ({
      platform: PLATFORMS.find(p => p.value === platform)?.label || platform,
      ...data,
      roas: data.spend > 0 ? data.revenue / data.spend : 0,
    }));
  }, [filtered]);

  const dailyTrend = useMemo(() => {
    const map = new Map<string, { date: string; spend: number; revenue: number }>();
    filtered.forEach(m => {
      const cur = map.get(m.date) || { date: m.date, spend: 0, revenue: 0 };
      map.set(m.date, { date: m.date, spend: cur.spend + Number(m.spend), revenue: cur.revenue + Number(m.revenue) });
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [filtered]);

  const bestCampaign = useMemo(() => {
    if (!filtered.length) return null;
    const campMap = new Map<string, { name: string; platform: string; spend: number; revenue: number }>();
    filtered.forEach(m => {
      const key = m.campaign_name;
      const cur = campMap.get(key) || { name: m.campaign_name, platform: m.platform, spend: 0, revenue: 0 };
      campMap.set(key, { ...cur, spend: cur.spend + Number(m.spend), revenue: cur.revenue + Number(m.revenue) });
    });
    return Array.from(campMap.values()).sort((a, b) => {
      const ra = a.spend > 0 ? a.revenue / a.spend : 0;
      const rb = b.spend > 0 ? b.revenue / b.spend : 0;
      return rb - ra;
    })[0] || null;
  }, [filtered]);

  const handleAddMetric = async () => {
    if (!user || !newMetric.campaign_name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    const { error } = await supabase.from("campaign_metrics").insert({
      coach_id: user.id,
      ...newMetric,
      source: "manual",
    });
    if (error) { toast.error("Failed to add: " + error.message); return; }
    toast.success("Campaign data added");
    setAddDialogOpen(false);
    setNewMetric({ platform: "google_ads", campaign_name: "", date: format(new Date(), "yyyy-MM-dd"), spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, leads: 0, add_to_cart: 0, checkouts: 0, purchases: 0 });
    // Refetch
    const { data } = await supabase.from("campaign_metrics").select("*").eq("coach_id", user.id).order("date", { ascending: false });
    if (data) setMetrics(data as unknown as CampaignMetric[]);
  };

  const handleShareRequest = async () => {
    if (!user || !shareForm.email.trim() || !shareForm.name.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const { error } = await supabase.from("report_sharing_requests").insert({
      coach_id: user.id,
      recipient_name: shareForm.name,
      recipient_email: shareForm.email,
      recipient_role: shareForm.role,
    });
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Sharing request submitted for admin approval");
    setShareDialogOpen(false);
    setShareForm({ name: "", email: "", role: "viewer" });
  };

  const exportCSV = () => {
    if (!filtered.length) { toast.error("No data to export"); return; }
    const headers = ["Date", "Platform", "Campaign", "Spend", "Impressions", "Clicks", "Conversions", "Revenue", "ROAS", "CPC", "CTR", "CPA"];
    const rows = filtered.map(m => [m.date, m.platform, m.campaign_name, m.spend, m.impressions, m.clicks, m.conversions, m.revenue, Number(m.roas).toFixed(2), Number(m.cpc).toFixed(2), Number(m.ctr).toFixed(2), Number(m.cpa).toFixed(2)]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `campaign-insights-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (loading) return <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Campaigns & Insights
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Unified multi-platform campaign performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1"><Download className="h-4 w-4" /> Export</Button>
          <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)} className="gap-1"><Share2 className="h-4 w-4" /> Share</Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1"><Plus className="h-4 w-4" /> Add Data</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Platform</label>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">From</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px]" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px]" />
        </div>
        {(platformFilter !== "all" || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setPlatformFilter("all"); setDateFrom(""); setDateTo(""); }}>Clear</Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {[
          { label: "Total Spend", value: `₹${totals.spend.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-red-400" },
          { label: "Revenue", value: `₹${totals.revenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-400" },
          { label: "ROAS", value: `${totals.roas.toFixed(1)}x`, icon: Zap, color: "text-primary" },
          { label: "Leads / Sales", value: `${totals.leads} / ${totals.conversions}`, icon: Target, color: "text-blue-400" },
          { label: "CPA", value: `₹${totals.cpa.toFixed(0)}`, icon: MousePointerClick, color: "text-orange-400" },
          { label: "CTR", value: `${totals.ctr.toFixed(2)}%`, icon: Eye, color: "text-purple-400" },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Best Campaign Banner */}
      {bestCampaign && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Zap className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Best Performing Campaign</p>
              <p className="font-bold text-foreground">{bestCampaign.name}</p>
              <p className="text-xs text-muted-foreground">
                {PLATFORMS.find(p => p.value === bestCampaign.platform)?.label} • ROAS: {bestCampaign.spend > 0 ? (bestCampaign.revenue / bestCampaign.spend).toFixed(1) : 0}x • Revenue: ₹{bestCampaign.revenue.toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Spend Trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue vs Spend Trend</CardTitle></CardHeader>
          <CardContent>
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220, 10%, 60%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 60%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(72, 100%, 50%)" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="spend" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} name="Spend" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-12">No data yet. Add campaign data to see trends.</p>}
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Platform Breakdown</CardTitle></CardHeader>
          <CardContent>
            {platformBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={platformBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "hsl(220, 10%, 60%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220, 10%, 60%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8 }} />
                  <Bar dataKey="spend" fill="hsl(0, 84%, 60%)" name="Spend" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="hsl(72, 100%, 50%)" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-12">No platform data available.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-12">No campaign data. Click "Add Data" to enter metrics manually or connect ad platforms.</TableCell></TableRow>
                )}
                {filtered.slice(0, 50).map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium max-w-[180px] truncate">{m.campaign_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{PLATFORMS.find(p => p.value === m.platform)?.label || m.platform}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.date}</TableCell>
                    <TableCell className="text-right">₹{Number(m.spend).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right text-green-400">₹{Number(m.revenue).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <span className={Number(m.roas) >= 1 ? "text-green-400" : "text-red-400"}>
                        {Number(m.roas).toFixed(1)}x
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{m.clicks}</TableCell>
                    <TableCell className="text-right">{m.conversions}</TableCell>
                    <TableCell className="text-right">₹{Number(m.cpa).toFixed(0)}</TableCell>
                    <TableCell className="text-right">{Number(m.ctr).toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Data Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Campaign Data</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Platform</label>
              <Select value={newMetric.platform} onValueChange={v => setNewMetric({ ...newMetric, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.filter(p => p.value !== "all").map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Campaign Name</label>
              <Input value={newMetric.campaign_name} onChange={e => setNewMetric({ ...newMetric, campaign_name: e.target.value })} placeholder="e.g., Summer Sale 2026" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Date</label>
              <Input type="date" value={newMetric.date} onChange={e => setNewMetric({ ...newMetric, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "spend", label: "Spend (₹)" },
                { key: "impressions", label: "Impressions" },
                { key: "clicks", label: "Clicks" },
                { key: "conversions", label: "Conversions" },
                { key: "revenue", label: "Revenue (₹)" },
                { key: "leads", label: "Leads" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground">{f.label}</label>
                  <Input type="number" value={(newMetric as any)[f.key]} onChange={e => setNewMetric({ ...newMetric, [f.key]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
            <Button onClick={handleAddMetric} className="w-full">Add Campaign Data</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Request Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Report Sharing</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Submit a sharing request. Admin will review and approve access.</p>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm text-muted-foreground">Recipient Name</label>
              <Input value={shareForm.name} onChange={e => setShareForm({ ...shareForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Recipient Email</label>
              <Input type="email" value={shareForm.email} onChange={e => setShareForm({ ...shareForm, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <Select value={shareForm.role} onValueChange={v => setShareForm({ ...shareForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleShareRequest} className="w-full">Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachCampaignInsights;
