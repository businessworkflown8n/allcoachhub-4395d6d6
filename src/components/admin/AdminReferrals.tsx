import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalDateRangePicker, { useDateRange } from "@/components/shared/GlobalDateRangePicker";
import { Users, TrendingUp, DollarSign, BarChart3, Download, Search, ChevronUp, ChevronDown, Eye, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell, BarChart, Bar } from "recharts";

type Referral = {
  id: string;
  referrer_id: string;
  referrer_role: string;
  referred_email: string;
  referred_user_id: string | null;
  status: string;
  commission_earned: number | null;
  points_earned: number | null;
  created_at: string;
  referrer_name?: string;
  referrer_email?: string;
  referrer_mobile?: string;
  referred_name?: string;
  referred_mobile?: string;
};

type SortKey = "referrer_name" | "referred_email" | "created_at" | "status" | "commission_earned";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  registered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  enrolled: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  converted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const { dateRange, setDateRange, dateFrom, dateTo } = useDateRange("last30");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: refs }, { data: profs }] = await Promise.all([
      supabase.from("referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email, contact_number, whatsapp_number"),
    ]);

    const profileMap: Record<string, any> = {};
    (profs || []).forEach((p) => { profileMap[p.user_id] = p; });
    setProfiles(profileMap);

    const enriched = (refs || []).map((r) => {
      const referrer = profileMap[r.referrer_id];
      const referred = r.referred_user_id ? profileMap[r.referred_user_id] : null;
      return {
        ...r,
        referrer_name: referrer?.full_name || "Unknown",
        referrer_email: referrer?.email || "",
        referrer_mobile: referrer?.contact_number || referrer?.whatsapp_number || "",
        referred_name: referred?.full_name || r.referred_email,
        referred_mobile: referred?.contact_number || referred?.whatsapp_number || "",
      };
    });

    setReferrals(enriched);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let data = referrals;

    if (dateFrom && dateTo) {
      data = data.filter((r) => {
        const d = r.created_at.slice(0, 10);
        return d >= dateFrom && d <= dateTo;
      });
    }

    if (statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((r) =>
        r.referrer_name?.toLowerCase().includes(q) ||
        r.referrer_email?.toLowerCase().includes(q) ||
        r.referrer_mobile?.includes(q) ||
        r.referred_email?.toLowerCase().includes(q) ||
        r.referred_name?.toLowerCase().includes(q) ||
        r.referred_mobile?.includes(q)
      );
    }

    data.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "referrer_name": av = a.referrer_name || ""; bv = b.referrer_name || ""; break;
        case "referred_email": av = a.referred_email || ""; bv = b.referred_email || ""; break;
        case "created_at": av = a.created_at; bv = b.created_at; break;
        case "status": av = a.status; bv = b.status; break;
        case "commission_earned": av = a.commission_earned || 0; bv = b.commission_earned || 0; break;
        default: av = a.created_at; bv = b.created_at;
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

    return data;
  }, [referrals, dateFrom, dateTo, statusFilter, search, sortKey, sortAsc]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const converted = filtered.filter((r) => ["enrolled", "converted", "paid"].includes(r.status)).length;
    const revenue = filtered.reduce((s, r) => s + (r.commission_earned || 0), 0);
    return {
      total,
      converted,
      rate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0",
      revenue,
    };
  }, [filtered]);

  // Growth trend chart data
  const trendData = useMemo(() => {
    const map: Record<string, { date: string; count: number; converted: number }> = {};
    filtered.forEach((r) => {
      const d = r.created_at.slice(0, 10);
      if (!map[d]) map[d] = { date: d, count: 0, converted: 0 };
      map[d].count++;
      if (["enrolled", "converted", "paid"].includes(r.status)) map[d].converted++;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  // Funnel data
  const funnelData = useMemo(() => {
    const total = filtered.length;
    const registered = filtered.filter((r) => ["registered", "enrolled", "converted", "paid"].includes(r.status)).length;
    const converted = filtered.filter((r) => ["enrolled", "converted", "paid"].includes(r.status)).length;
    const paid = filtered.filter((r) => r.status === "paid").length;
    return [
      { name: "Total Referrals", value: total, fill: "hsl(var(--primary))" },
      { name: "Registered", value: registered, fill: "hsl(var(--chart-2))" },
      { name: "Converted", value: converted, fill: "hsl(var(--chart-3))" },
      { name: "Paid", value: paid, fill: "hsl(var(--chart-4))" },
    ];
  }, [filtered]);

  // Top referrers leaderboard
  const topReferrers = useMemo(() => {
    const map: Record<string, { name: string; email: string; count: number; converted: number; revenue: number }> = {};
    filtered.forEach((r) => {
      if (!map[r.referrer_id]) {
        map[r.referrer_id] = { name: r.referrer_name || "Unknown", email: r.referrer_email || "", count: 0, converted: 0, revenue: 0 };
      }
      map[r.referrer_id].count++;
      if (["enrolled", "converted", "paid"].includes(r.status)) map[r.referrer_id].converted++;
      map[r.referrer_id].revenue += r.commission_earned || 0;
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered]);

  // Drill-down data for selected referrer
  const drillDown = useMemo(() => {
    if (!selectedReferrer) return [];
    return filtered.filter((r) => r.referrer_id === selectedReferrer);
  }, [filtered, selectedReferrer]);

  const drillStats = useMemo(() => {
    const total = drillDown.length;
    const converted = drillDown.filter((r) => ["enrolled", "converted", "paid"].includes(r.status)).length;
    const revenue = drillDown.reduce((s, r) => s + (r.commission_earned || 0), 0);
    const pending = total - converted;
    return { total, converted, revenue, pending };
  }, [drillDown]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) { setSortAsc(!sortAsc); } else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
  };

  const exportCSV = () => {
    const headers = ["Referrer Name", "Referrer Email", "Referrer Mobile", "Referred User", "Referred Email", "Referred Mobile", "Date", "Status", "Commission"];
    const rows = filtered.map((r) => [
      r.referrer_name, r.referrer_email, r.referrer_mobile, r.referred_name, r.referred_email, r.referred_mobile,
      format(new Date(r.created_at), "yyyy-MM-dd"), r.status, r.commission_earned || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `referrals_${dateFrom}_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filtered.length} referrals exported.` });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-foreground">Referral Tracking</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <GlobalDateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-2" /> Converted
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{stats.converted}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-3" /> Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{stats.rate}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-chart-4" /> Revenue from Referrals
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">${stats.revenue.toFixed(2)}</p></CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Referral Growth Trend</CardTitle></CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" name="Referrals" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="converted" name="Converted" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data for selected range</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((item, i) => {
                const maxVal = funnelData[0].value || 1;
                const pct = ((item.value / maxVal) * 100).toFixed(0);
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.name}</span>
                      <span className="font-semibold text-foreground">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-6 bg-muted rounded-md overflow-hidden">
                      <div className="h-full rounded-md transition-all" style={{ width: `${pct}%`, backgroundColor: item.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers Leaderboard */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Top Referrers</CardTitle></CardHeader>
        <CardContent>
          {topReferrers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Converted</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topReferrers.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{r.email}</TableCell>
                      <TableCell className="text-right font-semibold">{r.count}</TableCell>
                      <TableCell className="text-right">{r.converted}</TableCell>
                      <TableCell className="text-right">${r.revenue.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedReferrer(r.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No referrals found</p>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, mobile..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="enrolled">Enrolled</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("referrer_name")}>Referrer <SortIcon col="referrer_name" /></TableHead>
                  <TableHead>Referrer Contact</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("referred_email")}>Referred User <SortIcon col="referred_email" /></TableHead>
                  <TableHead>Referred Contact</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>Date <SortIcon col="created_at" /></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>Status <SortIcon col="status" /></TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort("commission_earned")}>Commission <SortIcon col="commission_earned" /></TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No referrals found</TableCell></TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.referrer_name}</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>{r.referrer_email}</div>
                          {r.referrer_mobile && <div>{r.referrer_mobile}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{r.referred_name}</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>{r.referred_email}</div>
                          {r.referred_mobile && <div>{r.referred_mobile}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">${(r.commission_earned || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedReferrer(r.referrer_id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Drill-Down Dialog */}
      <Dialog open={!!selectedReferrer} onOpenChange={() => setSelectedReferrer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Referrals by {drillDown[0]?.referrer_name || "User"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold">{drillStats.total}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Converted</p><p className="text-lg font-bold text-green-600">{drillStats.converted}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-lg font-bold text-yellow-600">{drillStats.pending}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-bold">${drillStats.revenue.toFixed(2)}</p></CardContent></Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referred User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drillDown.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.referred_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.referred_email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell><Badge variant="secondary" className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right">${(r.commission_earned || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReferrals;
